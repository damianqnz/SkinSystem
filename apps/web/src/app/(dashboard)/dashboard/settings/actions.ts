'use server';

import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getStripe }                  from '@/shared/lib/stripe';
import { setStripeAccountId }         from '@/domains/organizations/service';
import { db }                         from '@/infrastructure/db';
import { organizations }              from '@/infrastructure/db/schema/organizations';
import { eq }                         from 'drizzle-orm';

// ── State types ───────────────────────────────────────────────

export type StripeConnectState =
  | { status: 'idle' }
  | { status: 'redirect'; url: string }
  | { status: 'error'; message: string };

// ── Helper: resolve orgId from authenticated session ──────────

async function resolveOrgId(): Promise<{ orgId: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { error: 'Organización no encontrada en sesión' };
  return { orgId };
}

// ── createStripeConnectAccount ────────────────────────────────

/**
 * Initiates Stripe Connect Standard onboarding for a specialist.
 *
 * Flow:
 *   1. Verify auth → get orgId
 *   2. Check if org already has a Stripe account (idempotent)
 *   3. If not → stripe.accounts.create({ type: 'standard' })
 *   4. Persist stripeAccountId in DB
 *   5. stripe.accountLinks.create → return redirect URL
 *
 * Security:
 *   - orgId from server session (not client input)
 *   - Each org can only ever have ONE Stripe account
 *   - Account ID persisted before returning link (survives redirect loss)
 */
export async function createStripeConnectAccount(
  _prev: StripeConnectState,
  _raw:  unknown,
): Promise<StripeConnectState> {
  const auth = await resolveOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const stripe   = getStripe();
  const baseUrl  = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  try {
    // Check for existing Stripe account
    const orgRows = await db
      .select({ stripeAccountId: organizations.stripeAccountId, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, auth.orgId))
      .limit(1);

    const org = orgRows[0];
    if (!org) return { status: 'error', message: 'Organización no encontrada' };

    let accountId = org.stripeAccountId;

    // Create account if not yet linked
    if (!accountId) {
      const account = await stripe.accounts.create({
        type: 'standard',
        metadata: { organizationId: auth.orgId },
      });
      accountId = account.id;

      // Persist immediately — before creating the link
      const saveResult = await setStripeAccountId(auth.orgId, accountId);
      if (saveResult.error) {
        return { status: 'error', message: 'No se pudo guardar la cuenta de Stripe' };
      }
    }

    // Create onboarding link (expires in ~10 min)
    const accountLink = await stripe.accountLinks.create({
      account:     accountId,
      type:        'account_onboarding',
      refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
      return_url:  `${baseUrl}/dashboard/settings?stripe=success`,
    });

    return { status: 'redirect', url: accountLink.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de Stripe';
    return { status: 'error', message: msg };
  }
}

/**
 * Refresh an expired onboarding link for an org that already has a
 * Stripe account ID but hasn't completed onboarding.
 */
export async function refreshStripeOnboardingLink(
  _prev: StripeConnectState,
  _raw:  unknown,
): Promise<StripeConnectState> {
  const auth = await resolveOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const stripe  = getStripe();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';

  try {
    const orgRows = await db
      .select({ stripeAccountId: organizations.stripeAccountId })
      .from(organizations)
      .where(eq(organizations.id, auth.orgId))
      .limit(1);

    const accountId = orgRows[0]?.stripeAccountId;
    if (!accountId) {
      return { status: 'error', message: 'No hay cuenta de Stripe vinculada' };
    }

    const link = await stripe.accountLinks.create({
      account:     accountId,
      type:        'account_onboarding',
      refresh_url: `${baseUrl}/dashboard/settings?stripe=refresh`,
      return_url:  `${baseUrl}/dashboard/settings?stripe=success`,
    });

    return { status: 'redirect', url: link.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de Stripe';
    return { status: 'error', message: msg };
  }
}
