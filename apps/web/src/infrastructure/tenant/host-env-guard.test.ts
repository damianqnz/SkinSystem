/**
 * @file host-env-guard.test.ts
 * @description Dedicated regression test for the `NEXT_PUBLIC_BASE_DOMAIN`-absent
 *              scenario (TEST-03). `host.test.ts` covers the pure helpers but relies
 *              on `vitest.config.ts`'s global `test.env` block to make `host.ts`
 *              importable at all — an incidental tripwire, not a direct assertion.
 *              This file explicitly unsets the env var and asserts the exact
 *              failure mode `host.ts`'s own `requireBaseDomain()` documents.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('host.ts — NEXT_PUBLIC_BASE_DOMAIN required at import time', () => {
  const ORIGINAL = process.env.NEXT_PUBLIC_BASE_DOMAIN;

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_BASE_DOMAIN = ORIGINAL;
  });

  it('rejects with the exact configured message when the env var is absent', async () => {
    delete process.env.NEXT_PUBLIC_BASE_DOMAIN;
    await expect(import('./host')).rejects.toThrow(
      'NEXT_PUBLIC_BASE_DOMAIN is required and has no safe default.',
    );
  });

  it('resolves normally when the env var is present', async () => {
    process.env.NEXT_PUBLIC_BASE_DOMAIN = 'skinsystem.test';
    const { BASE_DOMAIN } = await import('./host');
    expect(BASE_DOMAIN).toBe('skinsystem.test');
  });
});
