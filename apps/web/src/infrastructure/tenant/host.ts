/**
 * @file host.ts
 * @description Hostname → tenant identity. Single source of truth for the apex
 *              domain, the local development apexes, and the tenant slug shape.
 */

/**
 * Subdomains that are never treated as tenant slugs. Every top-level route
 * added under `(marketing)` belongs here too — otherwise a tenant registering
 * that slug shadows the corresponding apex page.
 */
const RESERVED_SUBDOMAINS = new Set([
  'www', 'auth', 'api', 'admin', 'app', 'cdn', 'static', 'mail',
]);

/** RFC-1123 label — the only shape a tenant slug may take. */
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

/** Local development apexes. Ports are stripped before comparison. */
export const LOCAL_APEXES = ['localhost', 'lvh.me', '127.0.0.1'] as const;

/**
 * Apex domain, environment-driven so staging and preview never guess.
 *
 * No fallback on purpose: defaulting to the production apex would make an
 * unconfigured preview build resolve tenants against — and redirect logins
 * to — the real production host. Fail at build time instead.
 */
function requireBaseDomain(): string {
  const value = process.env.NEXT_PUBLIC_BASE_DOMAIN;
  if (!value) throw new Error('NEXT_PUBLIC_BASE_DOMAIN is required and has no safe default.');
  return value;
}

export const BASE_DOMAIN = requireBaseDomain();

/** Lowercases the host and strips the port, so no port is ever hardcoded. */
export function normalizeHost(rawHost: string | null): string {
  return (rawHost ?? '').toLowerCase().split(':')[0] ?? '';
}

/** True when the request came from a local development apex. */
export function isLocalHost(rawHost: string | null): boolean {
  const host = normalizeHost(rawHost);
  return LOCAL_APEXES.some((apex) => host.endsWith(apex));
}

/**
 * Extracts the tenant slug from a normalized (port-less) hostname.
 * Returns null for the apex, reserved subdomains, nested subdomains,
 * malformed labels, and unknown hosts.
 *
 * @example
 * extractTenantSlug('lourdes.skinsystem.pt') → 'lourdes'
 * extractTenantSlug('lourdes.lvh.me')        → 'lourdes'
 * extractTenantSlug('auth.skinsystem.pt')    → null (reserved)
 * extractTenantSlug('a.b.skinsystem.pt')     → null (nested)
 * extractTenantSlug('skinsystem.pt')         → null (apex)
 */
export function extractTenantSlug(host: string): string | null {
  for (const apex of [BASE_DOMAIN, ...LOCAL_APEXES]) {
    if (host === apex) return null;
    if (!host.endsWith(`.${apex}`)) continue;

    const sub = host.slice(0, -(apex.length + 1));
    if (!sub || sub.includes('.') || RESERVED_SUBDOMAINS.has(sub)) return null;

    return SLUG_PATTERN.test(sub) ? sub : null;
  }
  return null;
}
