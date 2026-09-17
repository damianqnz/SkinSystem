/**
 * @file stripe-policy.test.ts
 * @description Regression test for the production Stripe Connect hardening debt
 *              (HEARTBEAT.md "Hardening producción"): a direct platform charge
 *              must never be allowed in production, even if STRIPE_SECRET_KEY is
 *              misconfigured as a test key.
 */
import { describe, expect, it } from 'vitest';
import { allowsDirectPlatformCharge } from './stripe-policy';

describe('allowsDirectPlatformCharge', () => {
  it('denies a direct charge in production, even with a test key', () => {
    expect(allowsDirectPlatformCharge('production', 'sk_test_123')).toBe(false);
  });

  it('denies a direct charge in production with a live key', () => {
    expect(allowsDirectPlatformCharge('production', 'sk_live_123')).toBe(false);
  });

  it('allows a direct charge outside production with a test key', () => {
    expect(allowsDirectPlatformCharge('development', 'sk_test_123')).toBe(true);
    expect(allowsDirectPlatformCharge('test', 'sk_test_123')).toBe(true);
    expect(allowsDirectPlatformCharge(undefined, 'sk_test_123')).toBe(true);
  });

  it('denies a direct charge outside production with a live key', () => {
    expect(allowsDirectPlatformCharge('development', 'sk_live_123')).toBe(false);
  });

  it('denies a direct charge when the key is missing', () => {
    expect(allowsDirectPlatformCharge('development', undefined)).toBe(false);
  });
});
