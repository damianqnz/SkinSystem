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
    // Protocol check: `javascript://<slug>.<domain>/…` parses with the tenant
    // hostname and would otherwise pass the hostname test below.
    const webProtocol = url.protocol === 'http:' || url.protocol === 'https:';
    if (webProtocol && allowed.includes(url.hostname)) return next;
  } catch {
    // Invalid URL — fall through to default
  }

  return defaultUrl;
}

/** Any resolvable origin works: it only exists so `new URL` can resolve a relative input. */
const RELATIVE_NEXT_BASE = 'http://relative-next.invalid';

/**
 * Validates a RELATIVE, same-origin `next` (the shape /auth/callback and
 * /auth/confirm accept) and returns the safe `path?query#hash`, or `null`.
 *
 * Accepted: starts with a single `/`. Rejected: no leading slash (covers
 * empty, `https://x`, `javascript:`), `//host`, and `/\host` (browsers read a
 * backslash as a slash, so `/\evil.com` is protocol-relative).
 *
 * The result is the URL-normalized form, so what is checked is exactly what is
 * redirected to: dot segments (`/book/../dashboard`, `/book/%2e%2e/x`) collapse
 * BEFORE `isBookingFunnelPath` looks at the path, and tab/newline tricks the
 * WHATWG parser strips (`/\t/evil.com`) are caught by the origin check.
 */
export function parseRelativeNext(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith('/')) return null;
  if (raw[1] === '/' || raw[1] === '\\') return null;

  let url: URL;
  try {
    url = new URL(raw, RELATIVE_NEXT_BASE);
  } catch {
    return null;
  }
  if (url.origin !== RELATIVE_NEXT_BASE) return null;

  const safe = `${url.pathname}${url.search}${url.hash}`;
  // `/.//evil.com` collapses to `//evil.com`: harmless behind an origin, but never emitted.
  return safe.startsWith('//') ? null : safe;
}

/**
 * True for the booking funnel: `/book` and anything beneath it, optionally
 * followed by a query or fragment. Segment match — `/booking-x` and `/bookmark`
 * are not the funnel. Expects a path already normalized by `parseRelativeNext`.
 */
export function isBookingFunnelPath(path: string): boolean {
  return /^\/book(?:[/?#]|$)/.test(path);
}
