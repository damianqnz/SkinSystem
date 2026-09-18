/**
 * Pure Stripe billing-policy helpers, deliberately free of the `server-only`
 * guard (unlike stripe.ts) so they stay importable from Vitest without a
 * Stripe SDK / secret-key dependency.
 */

/**
 * Whether a booking may charge the platform account directly, without a
 * connected specialist Stripe account. Only true outside production AND
 * with a Stripe test key — a misconfigured `sk_test_` key must still fail
 * hard in production, since a direct charge there means co-mingled funds.
 */
export function allowsDirectPlatformCharge(
  nodeEnv: string | undefined,
  stripeSecretKey: string | undefined,
): boolean {
  const isProduction = nodeEnv === 'production';
  const isTestKey    = stripeSecretKey?.startsWith('sk_test_') ?? false;
  return isTestKey && !isProduction;
}

export type StripeConnectState = 'connected' | 'pending' | 'disconnected';

/**
 * The Stripe Connect card's state, derived from the org's persisted
 * capability flags. "connected" requires BOTH `chargesEnabled` and
 * `payoutsEnabled` — an account can finish onboarding and accept charges
 * while payouts are still restricted (e.g. a bank-details requirement),
 * and that's not a fully working account yet.
 */
export function resolveStripeConnectState(args: {
  hasAccount:     boolean;
  onboarded:      boolean;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
}): StripeConnectState {
  if (!args.hasAccount) return 'disconnected';
  if (args.onboarded && args.chargesEnabled && args.payoutsEnabled) return 'connected';
  return 'pending';
}
