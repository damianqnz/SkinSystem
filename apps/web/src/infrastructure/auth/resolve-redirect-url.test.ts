/**
 * @file resolve-redirect-url.test.ts
 * @description Unit coverage for the open-redirect guard used after login.
 *              Env is stubbed per test: the module reads it at call time.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildTenantOrigin, resolveRedirectUrl } from './resolve-redirect-url';

afterEach(() => {
  vi.unstubAllEnvs();
});

function stubProduction() {
  vi.stubEnv('NODE_ENV', 'production');
  vi.stubEnv('NEXT_PUBLIC_BASE_DOMAIN', 'skinsystem.test');
}

describe('buildTenantOrigin', () => {
  it('builds an http lvh.me origin with the dev port outside production', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(buildTenantOrigin('lourdes')).toBe('http://lourdes.lvh.me:3000');
  });

  it('builds an https origin on the base domain in production', () => {
    stubProduction();
    expect(buildTenantOrigin('lourdes')).toBe('https://lourdes.skinsystem.test');
  });

  it('falls back to skinsystem.pt when NEXT_PUBLIC_BASE_DOMAIN is unset in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_BASE_DOMAIN', undefined);
    expect(buildTenantOrigin('lourdes')).toBe('https://lourdes.skinsystem.pt');
  });
});

describe('resolveRedirectUrl (production)', () => {
  it('returns the default tenant URL when there is no next', () => {
    stubProduction();
    expect(resolveRedirectUrl(undefined, 'lourdes', '/me')).toBe('https://lourdes.skinsystem.test/me');
    expect(resolveRedirectUrl(undefined, 'lourdes', '/dashboard')).toBe(
      'https://lourdes.skinsystem.test/dashboard',
    );
  });

  it('accepts a next on the same org subdomain, returned verbatim', () => {
    stubProduction();
    const next = 'https://lourdes.skinsystem.test/me/citas?tab=upcoming';
    expect(resolveRedirectUrl(next, 'lourdes', '/me')).toBe(next);
  });

  it('rejects a next on another org subdomain', () => {
    stubProduction();
    expect(resolveRedirectUrl('https://other.skinsystem.test/me', 'lourdes', '/me')).toBe(
      'https://lourdes.skinsystem.test/me',
    );
  });

  it('rejects a next on another domain', () => {
    stubProduction();
    expect(resolveRedirectUrl('https://evil.example/me', 'lourdes', '/me')).toBe(
      'https://lourdes.skinsystem.test/me',
    );
  });

  it('rejects hosts that only embed or extend the tenant host', () => {
    stubProduction();
    const fallback = 'https://lourdes.skinsystem.test/me';
    expect(resolveRedirectUrl('https://lourdes.skinsystem.test.evil.example/', 'lourdes', '/me')).toBe(fallback);
    expect(resolveRedirectUrl('https://evil.example/?h=lourdes.skinsystem.test', 'lourdes', '/me')).toBe(fallback);
    expect(resolveRedirectUrl('https://lourdes.skinsystem.test@evil.example/', 'lourdes', '/me')).toBe(fallback);
  });

  it('rejects malformed and relative next values', () => {
    stubProduction();
    const fallback = 'https://lourdes.skinsystem.test/dashboard';
    for (const next of ['not a url', '/me', '//lourdes.skinsystem.test/me', '']) {
      expect(resolveRedirectUrl(next, 'lourdes', '/dashboard')).toBe(fallback);
    }
  });
});

describe('resolveRedirectUrl (outside production)', () => {
  it('defaults to the lvh.me dev origin', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(resolveRedirectUrl(undefined, 'lourdes', '/me')).toBe('http://lourdes.lvh.me:3000/me');
  });

  it('accepts a same-org lvh.me next, with or without a port', () => {
    vi.stubEnv('NODE_ENV', 'development');
    const withPort = 'http://lourdes.lvh.me:3000/dashboard';
    const withoutPort = 'http://lourdes.lvh.me/dashboard';
    expect(resolveRedirectUrl(withPort, 'lourdes', '/me')).toBe(withPort);
    expect(resolveRedirectUrl(withoutPort, 'lourdes', '/me')).toBe(withoutPort);
  });

  it('still rejects another org on lvh.me', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(resolveRedirectUrl('http://other.lvh.me:3000/me', 'lourdes', '/me')).toBe(
      'http://lourdes.lvh.me:3000/me',
    );
  });
});
