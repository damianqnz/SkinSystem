/**
 * @file build-login-url.test.ts
 * @description Unit coverage for the sign-in URL builder. Guards the fix for
 *              the relative-`next=/me` bug: `resolveRedirectUrl()` in
 *              `(auth)/login/actions.ts` requires an absolute URL, so every
 *              `next` this function produces must be one.
 */
import { describe, expect, it } from 'vitest';
import { buildLoginUrl } from './build-login-url';

describe('buildLoginUrl', () => {
  it('builds an absolute http URL on the same local host, with an absolute next param', () => {
    const url = buildLoginUrl('lourdes.lvh.me:3000', '/dashboard');
    expect(url.toString()).toBe(
      'http://lourdes.lvh.me:3000/login?next=http%3A%2F%2Flourdes.lvh.me%3A3000%2Fdashboard',
    );
  });

  it('routes to the centralised auth subdomain over https for a production host', () => {
    const url = buildLoginUrl('lourdes.skinsystem.test', '/me');
    expect(url.hostname).toBe('auth.skinsystem.test');
    expect(url.protocol).toBe('https:');
    // The `next` param still points back at the ORIGINAL tenant host, not the auth host.
    expect(url.searchParams.get('next')).toBe('https://lourdes.skinsystem.test/me');
  });

  it('produces a next param that is always a valid absolute URL — the exact contract resolveRedirectUrl() requires', () => {
    const url = buildLoginUrl('lourdes.skinsystem.test', '/me');
    const next = url.searchParams.get('next')!;
    expect(() => new URL(next)).not.toThrow();
  });

  it('falls back to an empty host string when the host header is missing', () => {
    const url = buildLoginUrl(null, '/me');
    expect(url.hostname).toBe('auth.skinsystem.test');
    expect(url.searchParams.get('next')).toBe('https:///me');
  });
});
