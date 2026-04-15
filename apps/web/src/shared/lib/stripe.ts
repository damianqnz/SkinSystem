import 'server-only';

import Stripe from 'stripe';

/**
 * Stripe singleton — lazy-initialized to avoid build-time failures
 * when STRIPE_SECRET_KEY is not yet set.
 *
 * Uses the latest API version supported by the installed SDK.
 * Every payment must flow through the specialist's own connected account
 * via `transfer_data.destination` — NEVER co-mingle org funds.
 *
 * Required env vars:
 *   STRIPE_SECRET_KEY          — Platform secret key (sk_live_… / sk_test_…)
 *   STRIPE_WEBHOOK_SECRET      — Endpoint signing secret (whsec_…)
 *   NEXT_PUBLIC_BASE_URL       — Full origin for redirect URLs (https://skinsystem.pt)
 *   STRIPE_PLATFORM_FEE_BPS   — Platform fee in basis points (default: 1000 = 10%)
 */

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('Missing STRIPE_SECRET_KEY');
    _stripe = new Stripe(key, {
      typescript: true,
      appInfo: {
        name:    'SkinSystem',
        version: '1.0.0',
        url:     'https://skinsystem.pt',
      },
    });
  }
  return _stripe;
}

/** Platform fee in basis points (100 bps = 1%). Defaults to 10%. */
export function getPlatformFeeBps(): number {
  const raw = process.env.STRIPE_PLATFORM_FEE_BPS;
  const n   = raw ? parseInt(raw, 10) : 1000;
  return isNaN(n) ? 1000 : n;
}

/**
 * Calculate the application fee for a given charge amount.
 * fee = round(amountCents * platformFeeBps / 10000)
 */
export function calcApplicationFee(amountCents: number): number {
  return Math.round(amountCents * getPlatformFeeBps() / 10_000);
}

/**
 * Calculate the amount to charge at checkout, respecting depositPercent.
 * If depositPercent = 50 and price = €100 → charge €50 now.
 */
export function calcDepositAmount(priceCents: number, depositPercent: number): number {
  if (depositPercent <= 0)   return 0;
  if (depositPercent >= 100) return priceCents;
  return Math.round(priceCents * depositPercent / 100);
}
