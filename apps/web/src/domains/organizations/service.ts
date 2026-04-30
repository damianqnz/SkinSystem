import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { organizations } from '@/infrastructure/db/schema/organizations';
import type { Result } from '@/shared/types/result';

export type OrgSummary = { id: string; name: string; slug: string; locale: string };

export type OrgSettings = OrgSummary & {
  stripeAccountId:       string | null;
  stripeOnboarded:       boolean;
  stripeChargesEnabled:  boolean;
  defaultCurrency:       string;
  primaryEmail:          string | null;
  logoUrl:               string | null;
};

const SLUG_COLS = {
  id:     organizations.id,
  name:   organizations.name,
  slug:   organizations.slug,
  locale: organizations.locale,
};

const SETTINGS_COLS = {
  id:                    organizations.id,
  name:                  organizations.name,
  slug:                  organizations.slug,
  locale:                organizations.locale,
  stripeAccountId:       organizations.stripeAccountId,
  stripeOnboarded:       organizations.stripeOnboarded,
  stripeChargesEnabled:  organizations.stripeChargesEnabled,
  defaultCurrency:       organizations.defaultCurrency,
  primaryEmail:          organizations.primaryEmail,
  logoUrl:               organizations.logoUrl,
};

// ── Resolvers ─────────────────────────────────────────────────

/** Resolves a subdomain slug to org UUID + minimal metadata. */
export async function getOrganizationBySlug(slug: string): Promise<Result<OrgSummary>> {
  try {
    const rows = await db
      .select(SLUG_COLS)
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);
    if (!rows[0]) return { data: null, error: { message: 'Organization not found', code: 'NOT_FOUND' } };
    return { data: rows[0], error: null };
  } catch {
    return { data: null, error: { message: 'Failed to fetch organization', code: 'DB_ERROR' } };
  }
}

/** Org settings including Stripe state — for the Settings page. */
export async function getOrganizationSettings(id: string): Promise<Result<OrgSettings>> {
  try {
    const rows = await db
      .select(SETTINGS_COLS)
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);
    if (!rows[0]) return { data: null, error: { message: 'Organization not found', code: 'NOT_FOUND' } };
    return { data: rows[0] as OrgSettings, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to fetch organization settings', code: 'DB_ERROR' } };
  }
}

/** Org by ID — used in webhook handlers that receive orgId from metadata. */
export async function getOrganizationById(id: string): Promise<Result<OrgSettings>> {
  return getOrganizationSettings(id);
}

// ── Stripe updates ────────────────────────────────────────────

/**
 * Persist the Stripe account ID after `accounts.create`.
 * Called once when the specialist initiates onboarding.
 */
export async function setStripeAccountId(
  orgId:           string,
  stripeAccountId: string,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(organizations)
      .set({ stripeAccountId, updatedAt: new Date() })
      .where(eq(organizations.id, orgId))
      .returning({ id: organizations.id });
    if (!rows[0]) return { data: null, error: { message: 'Org not found', code: 'NOT_FOUND' } };
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to save Stripe account', code: 'DB_ERROR' } };
  }
}

/**
 * Mark org as Stripe-onboarded.
 * Called from the `account.updated` webhook. `chargesEnabled` mirrors
 * Stripe's own `account.charges_enabled` field so the UI can show
 * "verification in progress" vs "ready to charge".
 */
export async function markStripeOnboarded(
  orgId:           string,
  onboarded:       boolean = true,
  chargesEnabled?: boolean,
): Promise<Result<{ id: string }>> {
  try {
    const patch: { stripeOnboarded: boolean; updatedAt: Date; stripeChargesEnabled?: boolean } = {
      stripeOnboarded: onboarded,
      updatedAt:       new Date(),
    };
    if (chargesEnabled !== undefined) patch.stripeChargesEnabled = chargesEnabled;

    const rows = await db
      .update(organizations)
      .set(patch)
      .where(eq(organizations.id, orgId))
      .returning({ id: organizations.id });
    if (!rows[0]) return { data: null, error: { message: 'Org not found', code: 'NOT_FOUND' } };
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to update onboarding status', code: 'DB_ERROR' } };
  }
}

/**
 * Soft Disconnect: clears local Stripe association without revoking on Stripe.
 * The specialist's Stripe account stays alive at dashboard.stripe.com — only
 * SkinSystem stops routing checkouts to it.
 */
export async function clearStripeAccount(
  orgId: string,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(organizations)
      .set({
        stripeAccountId:      null,
        stripeOnboarded:      false,
        stripeChargesEnabled: false,
        updatedAt:            new Date(),
      })
      .where(eq(organizations.id, orgId))
      .returning({ id: organizations.id });
    if (!rows[0]) return { data: null, error: { message: 'Org not found', code: 'NOT_FOUND' } };
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to disconnect Stripe', code: 'DB_ERROR' } };
  }
}
