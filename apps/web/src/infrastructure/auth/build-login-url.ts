/**
 * @file build-login-url.ts
 * @description Sign-in URL construction for the proxy auth guard.
 */

import type { NextRequest } from 'next/server';
import { BASE_DOMAIN, isLocalHost } from '@/infrastructure/tenant/host';

/**
 * Builds the sign-in URL.
 * Dev keeps `/login` on the SAME host to avoid cross-subdomain cookie issues.
 * Production uses the centralised auth portal on its own subdomain.
 */
export function buildLoginUrl(request: NextRequest, pathname: string): URL {
  const rawHost = request.headers.get('host') ?? '';
  const isLocal = isLocalHost(rawHost);
  const scheme = isLocal ? 'http' : 'https';
  const loginHost = isLocal ? rawHost : `auth.${BASE_DOMAIN}`;

  const url = new URL(`${scheme}://${loginHost}/login`);
  url.searchParams.set('next', `${scheme}://${rawHost}${pathname}`);
  return url;
}
