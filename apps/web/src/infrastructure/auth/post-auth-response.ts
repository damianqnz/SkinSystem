/**
 * @file post-auth-response.ts
 * @description Maps a `PostAuthDestination` (or a failed link verification) to
 *              the Route Handler response shared by /auth/callback and
 *              /auth/confirm. Route Handlers cannot render, so a failure is a
 *              redirect to /login carrying an error CODE only; `LoginForm` owns
 *              the translated copy.
 *
 * Failures go to /login on the SAME host the user arrived on (the tenant
 * subdomain): /login is served unrewritten there, with `x-tenant-slug` set,
 * which `loginAction` requires. `buildLoginUrl`'s `auth.<base domain>` portal
 * carries no tenant slug, so it is deliberately not used here.
 */
import { NextResponse } from 'next/server';
import type { PostAuthDestination } from './resolve-post-auth-destination';

export type LoginErrorCode = 'no_account' | 'generic' | 'link_invalid';

export function loginErrorRedirect(origin: string, code: LoginErrorCode): NextResponse {
  const url = new URL('/login', origin);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url);
}

export function postAuthResponse(destination: PostAuthDestination, origin: string): NextResponse {
  switch (destination.kind) {
    case 'redirect':
      return NextResponse.redirect(destination.url);
    case 'no_account':
      return loginErrorRedirect(origin, 'no_account');
    case 'error':
      return loginErrorRedirect(origin, 'generic');
  }
}
