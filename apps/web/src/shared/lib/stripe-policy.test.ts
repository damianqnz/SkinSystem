/**
 * @file stripe-policy.test.ts
 * @description Regression tests for pure Stripe Connect billing-policy rules
 *              (HEARTBEAT.md "Deuda Stripe"): production must never allow a
 *              direct platform charge, even with a misconfigured test key, and
 *              the Connect card must only report "connected" once BOTH the
 *              charges and payouts capabilities are actually enabled.
 */
import { describe, expect, it } from 'vitest';
import { allowsDirectPlatformCharge, resolveStripeConnectState } from './stripe-policy';

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

describe('resolveStripeConnectState', () => {
  it('is disconnected with no account', () => {
    expect(resolveStripeConnectState({
      hasAccount: false, onboarded: false, chargesEnabled: false, payoutsEnabled: false,
    })).toBe('disconnected');
  });

  it('is pending when onboarded but charges are not yet enabled', () => {
    expect(resolveStripeConnectState({
      hasAccount: true, onboarded: true, chargesEnabled: false, payoutsEnabled: true,
    })).toBe('pending');
  });

  it('is pending when charges are enabled but payouts are not — the granular gap this ticket fixes', () => {
    expect(resolveStripeConnectState({
      hasAccount: true, onboarded: true, chargesEnabled: true, payoutsEnabled: false,
    })).toBe('pending');
  });

  it('is pending when the account exists but onboarding was never finished', () => {
    expect(resolveStripeConnectState({
      hasAccount: true, onboarded: false, chargesEnabled: false, payoutsEnabled: false,
    })).toBe('pending');
  });

  it('is connected only when onboarded AND both capabilities are enabled', () => {
    expect(resolveStripeConnectState({
      hasAccount: true, onboarded: true, chargesEnabled: true, payoutsEnabled: true,
    })).toBe('connected');
  });
});
