import 'server-only';

/**
 * @file resolve-post-auth-destination.ts
 * @description The single post-auth funnel: given a Supabase session that was
 *              just established (password, OAuth code, or email-OTP link),
 *              decides which surface it belongs to on THIS tenant and, for a
 *              customer, activates the identity link. Shared by `loginAction`,
 *              /auth/callback and /auth/confirm so they cannot drift apart.
 *
 * Never calls `redirect()`: it returns a discriminated result so a Server
 * Action can throw the redirect and a Route Handler can return a response.
 *
 * Order (staff first, so the staff flow is unchanged):
 *   1. tenant slug -> organization
 *   2. staff `profiles` row in THIS org -> /dashboard (inactive -> sign out)
 *   3. customer already linked to this auth user (identity first, no email)
 *   4. customer by verified email -> activation primitive
 *
 * The `email_confirmed_at` gate in step 4 is the SINGLE enforcement point of the
 * verified-identity contract documented in `domains/customers/activation.ts`.
 *
 * B.0 rule (booking funnel): /auth/callback serves the live Google booking flow
 * (`?next=/book`), where a first-time booker has no `customers` row yet (the
 * booking upsert creates it later). For a `path` next under /book, a
 * not-yet-a-customer outcome therefore neither signs the user out nor blocks
 * the redirect: activation is best-effort and is retried at the next sign-in
 * through the email fallback. Every other outcome, and every other `next`,
 * keeps the strict behaviour. `loginAction` (`url` next) is never relaxed.
 *
 * Never log an email or a DB error message (Drizzle embeds query parameters).
 */
import { cookies }             from 'next/headers';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import { and, eq }             from 'drizzle-orm';
import { db }                  from '@/infrastructure/db';
import { organizations, profiles } from '@/infrastructure/db/schema/organizations';
import { customers }           from '@/infrastructure/db/schema/customers';
import { activateCustomerIdentity } from '@/domains/customers/activation';
import {
  buildTenantOrigin,
  isBookingFunnelPath,
  parseRelativeNext,
  resolveRedirectUrl,
} from './resolve-redirect-url';

const DASHBOARD_LOCALES = ['es', 'pt', 'en'] as const;
type DashboardLocale = (typeof DASHBOARD_LOCALES)[number];

/**
 * `next` in the form each caller has it:
 *  - `url`: `loginAction`'s absolute URL, validated by `resolveRedirectUrl`.
 *  - `path`: the routes' relative same-origin path (see `parseRelativeNext`);
 *    re-validated here so an unvalidated caller still cannot open a redirect.
 */
export type PostAuthNext =
  | { kind: 'url';  url: string | undefined }
  | { kind: 'path'; path: string | null };

export type PostAuthDestination =
  | { kind: 'redirect'; url: string }
  | { kind: 'no_account' }
  | { kind: 'error' };

export type ResolvePostAuthInput = {
  supabase:   SupabaseClient;
  user:       User;
  /** From the request's `x-tenant-slug` (set by the proxy), never from the user. */
  tenantSlug: string;
  next:       PostAuthNext;
};

function destinationUrl(
  next: PostAuthNext,
  orgSlug: string,
  defaultPath: '/dashboard' | '/me',
): string {
  if (next.kind === 'url') return resolveRedirectUrl(next.url, orgSlug, defaultPath);
  return `${buildTenantOrigin(orgSlug)}${parseRelativeNext(next.path) ?? defaultPath}`;
}

/** Booking-funnel `path` next: the only case where "not a customer yet" is not a denial. */
function isBookingFunnelNext(next: PostAuthNext): boolean {
  if (next.kind !== 'path') return false;
  const path = parseRelativeNext(next.path);
  return path !== null && isBookingFunnelPath(path);
}

async function deny(supabase: SupabaseClient): Promise<PostAuthDestination> {
  // No stray session for a user who does not belong to this tenant.
  await supabase.auth.signOut();
  return { kind: 'no_account' };
}

/** Hydrates DASHBOARD_LOCALE from the staff member's per-user preference. */
async function hydrateDashboardLocale(locale: string | null): Promise<void> {
  // NULL = no preference yet, so no cookie (proxy falls back to NEXT_LOCALE /
  // Accept-Language). Staff sharing a browser each get their own language.
  if (!locale || !(DASHBOARD_LOCALES as readonly string[]).includes(locale)) return;
  const cookieStore = await cookies();
  cookieStore.set('DASHBOARD_LOCALE', locale as DashboardLocale, {
    path:     '/',
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   60 * 60 * 24 * 365,
  });
}

async function resolve(input: ResolvePostAuthInput): Promise<PostAuthDestination> {
  const { supabase, user, tenantSlug, next } = input;

  // 1. Organization from the request's tenant.
  const [orgRow] = await db
    .select({ id: organizations.id, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.slug, tenantSlug))
    .limit(1);
  if (!orgRow) return { kind: 'error' };

  // 2. Staff first: a `profiles` row in THIS tenant.
  const [staffRow] = await db
    .select({ isActive: profiles.isActive, locale: profiles.locale })
    .from(profiles)
    .where(and(eq(profiles.id, user.id), eq(profiles.organizationId, orgRow.id)))
    .limit(1);
  if (staffRow) {
    if (!staffRow.isActive) return deny(supabase);
    await hydrateDashboardLocale(staffRow.locale);
    return { kind: 'redirect', url: destinationUrl(next, orgRow.slug, '/dashboard') };
  }

  // 3. Customer, identity first: already linked to this auth user (no email compare).
  const [linkedRow] = await db
    .select({ id: customers.id, isBlocked: customers.isBlocked })
    .from(customers)
    .where(and(eq(customers.organizationId, orgRow.id), eq(customers.authUserId, user.id)))
    .limit(1);
  if (linkedRow) {
    if (linkedRow.isBlocked) return deny(supabase);
    return { kind: 'redirect', url: destinationUrl(next, orgRow.slug, '/me') };
  }

  // 4. Email fallback IS the activation trigger; only for a VERIFIED email.
  const verifiedEmail = user.email?.toLowerCase();
  if (!verifiedEmail || !user.email_confirmed_at) return deny(supabase);

  const activation = await activateCustomerIdentity({
    organizationId: orgRow.id,
    authUserId:     user.id,
    verifiedEmail,
  });
  const deferActivation = isBookingFunnelNext(next);
  const proceed = (): PostAuthDestination =>
    ({ kind: 'redirect', url: destinationUrl(next, orgRow.slug, '/me') });

  if (activation.error) {
    // Best-effort in the booking funnel (the session is legitimate and the link
    // is retried at the next sign-in); everywhere else fail closed.
    if (deferActivation) return proceed();
    await supabase.auth.signOut();
    return { kind: 'error' };
  }

  switch (activation.data.kind) {
    case 'activate':
    case 'already_linked':
      return proceed();
    case 'no_account':
      return deferActivation ? proceed() : deny(supabase);
    case 'blocked':
    case 'identity_conflict':
      return deny(supabase);
  }
}

export async function resolvePostAuthDestination(
  input: ResolvePostAuthInput,
): Promise<PostAuthDestination> {
  try {
    return await resolve(input);
  } catch (error) {
    console.error('[post-auth] resolve_failed', {
      errorName: error instanceof Error ? error.name : 'unknown',
    });
    return { kind: 'error' };
  }
}
