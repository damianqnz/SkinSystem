'use server';

import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { getStripe }          from '@/shared/lib/stripe';
import { setStripeAccountId } from '@/domains/organizations/service';
import { db }                 from '@/infrastructure/db';
import { organizations }      from '@/infrastructure/db/schema/organizations';
import { eq }                 from 'drizzle-orm';

// ── State types ───────────────────────────────────────────────

export type StripeConnectState =
  | { status: 'idle' }
  | { status: 'redirect'; url: string }
  | { status: 'error'; message: string };

// ── Helpers ───────────────────────────────────────────────────

/** Only allow internal dashboard paths as Stripe return destinations. */
function safeReturnPath(raw: unknown): string {
  if (typeof raw !== 'object' || raw === null) return '/dashboard/integrations';
  const val = (raw as Record<string, unknown>).returnPath;
  if (typeof val === 'string' && val.startsWith('/dashboard/')) return val;
  return '/dashboard/integrations';
}

// ── createStripeConnectAccount ────────────────────────────────

/**
 * Initiates Stripe Connect onboarding for a specialist.
 *
 * Flow:
 *   1. Verify auth → get orgId
 *   2. Check if org already has a Stripe account (idempotent)
 *   3. If not → stripe.accounts.create
 *   4. Persist stripeAccountId before creating the link
 *   5. stripe.accountLinks.create → return redirect URL
 *
 * Security:
 *   - orgId from server session, never from client input
 *   - returnPath validated to internal /dashboard/ paths only
 *   - Each org can only ever have ONE Stripe account
 */
export async function createStripeConnectAccount(
  _prev: StripeConnectState,
  raw:   unknown,
): Promise<StripeConnectState> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const stripe      = getStripe();
  const baseUrl     = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const returnPath  = safeReturnPath(raw);

  try {
    const orgRows = await db
      .select({ stripeAccountId: organizations.stripeAccountId, name: organizations.name })
      .from(organizations)
      .where(eq(organizations.id, auth.orgId))
      .limit(1);

    const org = orgRows[0];
    if (!org) return { status: 'error', message: 'Organización no encontrada' };

    let accountId = org.stripeAccountId;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type:     'standard',
        metadata: { organizationId: auth.orgId },
      });
      accountId = account.id;

      // Persist before creating the link — survives redirect loss
      const saveResult = await setStripeAccountId(auth.orgId, accountId);
      if (saveResult.error) {
        return { status: 'error', message: 'No se pudo guardar la cuenta de Stripe' };
      }
    }

    const accountLink = await stripe.accountLinks.create({
      account:     accountId,
      type:        'account_onboarding',
      refresh_url: `${baseUrl}${returnPath}?stripe=refresh`,
      return_url:  `${baseUrl}${returnPath}?stripe=success`,
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
  raw:   unknown,
): Promise<StripeConnectState> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const stripe     = getStripe();
  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000';
  const returnPath = safeReturnPath(raw);

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
      refresh_url: `${baseUrl}${returnPath}?stripe=refresh`,
      return_url:  `${baseUrl}${returnPath}?stripe=success`,
    });

    return { status: 'redirect', url: link.url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error de Stripe';
    return { status: 'error', message: msg };
  }
}
