/**
 * @file resolve-redirect-url.test.ts
 * @description Unit coverage for the open-redirect guard used after login.
 *              Env is stubbed per test: the module reads it at call time.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildTenantOrigin,
  isBookingFunnelPath,
  parseRelativeNext,
  resolveRedirectUrl,
} from './resolve-redirect-url';

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

  it('rejects non-web protocols even when the hostname is the tenant host', () => {
    stubProduction();
    const fallback = 'https://lourdes.skinsystem.test/me';
    for (const next of [
      'javascript://lourdes.skinsystem.test/%0Aalert(1)',
      'JAVASCRIPT://lourdes.skinsystem.test/x',
      'data://lourdes.skinsystem.test/x',
      'ftp://lourdes.skinsystem.test/x',
    ]) {
      expect(resolveRedirectUrl(next, 'lourdes', '/me')).toBe(fallback);
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

describe('parseRelativeNext', () => {
  it.each([
    ['/me', '/me'],
    ['/', '/'],
    ['/book', '/book'],
    ['/book/x?y=1', '/book/x?y=1'],
    ['/book?step=2#pay', '/book?step=2#pay'],
    ['/me/citas?tab=upcoming', '/me/citas?tab=upcoming'],
  ])('accepts %j as %j', (raw, expected) => {
    expect(parseRelativeNext(raw)).toBe(expected);
  });

  it.each([
    ['null', null],
    ['undefined', undefined],
    ['empty', ''],
    ['no leading slash', 'book'],
    ['absolute https', 'https://x'],
    ['absolute same host', 'https://lourdes.skinsystem.test/me'],
    ['protocol-relative', '//evil.com'],
    ['protocol-relative with path', '//evil.com/book'],
    ['backslash after the slash', '/\\evil.com'],
    ['double slash then backslash', '/\\/evil.com'],
    ['javascript scheme', 'javascript:alert(1)'],
    ['javascript scheme with slashes', 'javascript://lourdes.skinsystem.test/x'],
    ['tab hidden slash', '/\t/evil.com'],
    ['newline hidden slash', '/\n/evil.com'],
    ['dot segment collapsing to //', '/.//evil.com'],
  ])('rejects %s', (_label, raw) => {
    expect(parseRelativeNext(raw)).toBeNull();
  });

  it('collapses dot segments so the result is what the browser will request', () => {
    expect(parseRelativeNext('/book/../dashboard')).toBe('/dashboard');
    expect(parseRelativeNext('/book/%2e%2e/dashboard')).toBe('/dashboard');
    expect(parseRelativeNext('/me/./citas')).toBe('/me/citas');
  });
});

describe('isBookingFunnelPath', () => {
  it.each(['/book', '/book/', '/book/x', '/book/x?y=1', '/book?step=2', '/book#pay'])(
    'matches %j',
    (path) => {
      expect(isBookingFunnelPath(path)).toBe(true);
    },
  );

  it.each(['/', '/me', '/booking-x', '/bookmark', '/books', '/Book', '/me/book', '/dashboard?next=/book'])(
    'does not match %j',
    (path) => {
      expect(isBookingFunnelPath(path)).toBe(false);
    },
  );

  it('does not treat a dot-segment escape as the funnel once normalized', () => {
    const normalized = parseRelativeNext('/book/../dashboard');
    expect(normalized).not.toBeNull();
    expect(isBookingFunnelPath(normalized ?? '')).toBe(false);
  });
});
