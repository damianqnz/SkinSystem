/**
 * @file post-auth-response.test.ts
 * @description The route-facing mapping: success follows the resolved URL,
 *              every failure is a /login redirect carrying an error code only.
 */
import { describe, expect, it } from 'vitest';
import { loginErrorRedirect, postAuthResponse } from './post-auth-response';

const ORIGIN = 'https://lourdes.skinsystem.test';

describe('postAuthResponse', () => {
  it('redirects to the resolved destination URL', () => {
    const response = postAuthResponse({ kind: 'redirect', url: `${ORIGIN}/book` }, ORIGIN);
    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(`${ORIGIN}/book`);
  });

  it('sends no_account to /login?error=no_account on the same host', () => {
    const response = postAuthResponse({ kind: 'no_account' }, ORIGIN);
    expect(response.headers.get('location')).toBe(`${ORIGIN}/login?error=no_account`);
  });

  it('sends an infrastructure error to /login?error=generic', () => {
    const response = postAuthResponse({ kind: 'error' }, ORIGIN);
    expect(response.headers.get('location')).toBe(`${ORIGIN}/login?error=generic`);
  });
});

describe('loginErrorRedirect', () => {
  it('carries link_invalid for a bad or expired link', () => {
    const response = loginErrorRedirect(ORIGIN, 'link_invalid');
    expect(response.headers.get('location')).toBe(`${ORIGIN}/login?error=link_invalid`);
  });
});
