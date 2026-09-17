/**
 * @file build-login-url.ts
 * @description Sign-in URL construction for the proxy auth guard and any
 *              Server Component running its own redundant defense-in-depth
 *              auth check (e.g. `(account)/me/layout.tsx`).
 */

import { BASE_DOMAIN, isLocalHost } from '@/infrastructure/tenant/host';

/**
 * Builds the sign-in URL.
 * Dev keeps `/login` on the SAME host to avoid cross-subdomain cookie issues.
 * Production uses the centralised auth portal on its own subdomain.
 *
 * Takes the raw `host` header value rather than a `NextRequest` so it can be
 * called from both `proxy.ts` (`request.headers.get('host')`) and a Server
 * Component (`(await headers()).get('host')`) without a request object.
 */
export function buildLoginUrl(rawHost: string | null, pathname: string): URL {
  const host = rawHost ?? '';
  const isLocal = isLocalHost(host);
  const scheme = isLocal ? 'http' : 'https';
  const loginHost = isLocal ? host : `auth.${BASE_DOMAIN}`;

  const url = new URL(`${scheme}://${loginHost}/login`);
  url.searchParams.set('next', `${scheme}://${host}${pathname}`);
  return url;
}
