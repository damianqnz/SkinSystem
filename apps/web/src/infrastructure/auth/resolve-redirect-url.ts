/**
 * @file resolve-redirect-url.ts
 * @description Post-auth redirect helpers shared by `loginAction` and the auth
 *              callback routes, so none of them can bypass the open-redirect
 *              guard. Sibling of `build-login-url.ts`.
 *
 * Pure on purpose: env is read at call time (never at import) so tests can
 * stub it, and there is no `server-only` or Next runtime import.
 */

/**
 * Builds the origin (`scheme://host`) of a tenant's subdomain.
 * Dev uses `<slug>.lvh.me:3000` over http; production uses `<slug>.<base domain>` over https.
 */
export function buildTenantOrigin(orgSlug: string): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt';
  const isLocal    = process.env.NODE_ENV !== 'production';
  const protocol   = isLocal ? 'http' : 'https';
  const host       = isLocal ? `${orgSlug}.lvh.me:3000` : `${orgSlug}.${baseDomain}`;
  return `${protocol}://${host}`;
}

/**
 * Resolves the post-login redirect URL for the given target path
 * (`/dashboard` for staff, `/me` for customers).
 * Validates an optional `next` override against the user's org subdomain to
 * prevent open-redirect abuse.
 */
export function resolveRedirectUrl(
  next: string | undefined,
  orgSlug: string,
  defaultPath: '/dashboard' | '/me',
): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt';
  const defaultUrl = `${buildTenantOrigin(orgSlug)}${defaultPath}`;

  if (!next) return defaultUrl;

  // Validate: the `next` URL must belong to this org's subdomain
  try {
    const url     = new URL(next);
    const allowed = [
      `${orgSlug}.${baseDomain}`,
      `${orgSlug}.lvh.me`,
    ];
    if (allowed.includes(url.hostname)) return next;
  } catch {
    // Invalid URL — fall through to default
  }

  return defaultUrl;
}
