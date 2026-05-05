'use server';

import { eq } from 'drizzle-orm';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { getStripe }          from '@/shared/lib/stripe';
import {
  setStripeAccountId,
  clearStripeAccount,
}                             from '@/domains/organizations/service';
import { db }                 from '@/infrastructure/db';
import { organizations }      from '@/infrastructure/db/schema/organizations';
import type { Result }        from '@/shared/types/result';

// ── State types ───────────────────────────────────────────────

export type StripeConnectState =
  | { status: 'idle' }
  | { status: 'redirect'; url: string }
  | { status: 'error'; message: string };

// Owner-only — Stripe configuration is fiscal data (WF-08).
const OWNER_ROLES = ['owner', 'super_admin'] as const;

function callbackUrls(): { return_url: string; refresh_url: string } {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  return {
    return_url:  `${baseUrl}/dashboard/integrations/stripe/callback?status=success`,
    refresh_url: `${baseUrl}/dashboard/integrations/stripe/callback?status=refresh`,
  };
}

// ── createStripeConnectAccount ────────────────────────────────

/**
 * Initiates Stripe Connect Standard onboarding for the current org.
 *
 * Flow:
 *   1. Verify auth + owner role → orgId
 *   2. Reuse existing Stripe account (idempotent)
 *   3. Otherwise stripe.accounts.create({ type: 'standard' }) → persist
 *   4. stripe.accountLinks.create → return redirect URL
 */
export async function createStripeConnectAccount(
  _prev: StripeConnectState,
  _raw:  unknown,
): Promise<StripeConnectState> {
  const auth = await resolveTenantOrgId(OWNER_ROLES);
  if ('error' in auth) return { status: 'error', message: auth.error };

  const stripe = getStripe();

  try {
    const orgRows = await db
      .select({ stripeAccountId: organizations.stripeAccountId })
      .from(organizations)
      .where(eq(organizations.id, auth.orgId))
      .limit(1);

    const org = orgRows[0];
    if (!org) return { status: 'error', message: 'Organización no encontrada' };

    let accountId = org.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: { organizationId: auth.orgId },
      });
      accountId = account.id;

      const saveResult = await setStripeAccountId(auth.orgId, accountId);
      if (saveResult.error) {
        return { status: 'error', message: 'No se pudo guardar la cuenta de Stripe' };
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      type:    'account_onboarding',
      ...callbackUrls(),
    });

    return { status: 'redirect', url: accountLink.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de Stripe';
    return { status: 'error', message: msg };
  }
}

/**
 * Refresh an expired onboarding link for an org that has an account ID
 * but hasn't completed verification.
 */
export async function refreshStripeOnboardingLink(
  _prev: StripeConnectState,
  _raw:  unknown,
): Promise<StripeConnectState> {
  const auth = await resolveTenantOrgId(OWNER_ROLES);
  if ('error' in auth) return { status: 'error', message: auth.error };

  const stripe = getStripe();

  try {
    const orgRows = await db
      .select({ stripeAccountId: organizations.stripeAccountId })
      .from(organizations)
      .where(eq(organizations.id, auth.orgId))
      .limit(1);

    const accountId = orgRows[0]?.stripeAccountId;
    if (!accountId) return { status: 'error', message: 'No hay cuenta de Stripe vinculada' };

    const link = await stripe.accountLinks.create({
      account: accountId,
      type:    'account_onboarding',
      ...callbackUrls(),
    });

    return { status: 'redirect', url: link.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de Stripe';
    return { status: 'error', message: msg };
  }
}

// ── disconnectStripeAccount ───────────────────────────────────

/**
 * Soft Disconnect — owner-only.
 *
 * Clears the local Stripe association so SkinSystem stops routing
 * checkouts to this account. Does NOT call `stripe.oauth.deauthorize`:
 * the specialist's Stripe account stays alive at dashboard.stripe.com
 * with all historical payouts and reports intact.
 */
export async function disconnectStripeAccount(): Promise<Result<{ disconnected: true }>> {
  const auth = await resolveTenantOrgId(OWNER_ROLES);
  if ('error' in auth) {
    return { data: null, error: { message: auth.error, code: auth.code } };
  }

  const result = await clearStripeAccount(auth.orgId);
  if (result.error) return { data: null, error: result.error };

  return { data: { disconnected: true }, error: null };
}
