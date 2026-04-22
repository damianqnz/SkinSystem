'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { db } from '@/infrastructure/db';
import { profiles, organizations } from '@/infrastructure/db/schema/organizations';
import { customers } from '@/infrastructure/db/schema/customers';

// ── Validation ────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  next:     z.string().optional(),
});

export type LoginState = { error: keyof AuthErrors } | null;
type AuthErrors = {
  invalid_credentials: string;
  no_account:          string;
  generic:             string;
};

// ── Action ────────────────────────────────────────────────────────
/**
 * Unified email/password sign-in via Supabase PKCE-ready client.
 *
 * Post-login routing (tenant-aware, keyed off `x-tenant-slug`):
 *   1. If the authenticated user has a `profiles` row in THIS tenant → staff
 *      dashboard (`{slug}.host/dashboard`).
 *   2. Else if a `customers` row with the same email exists in THIS tenant →
 *      customer space (`{slug}.host/me`).
 *   3. Else → `no_account` (user has credentials but does not belong to this
 *      tenant; the UI directs them to `/book` to start a first reservation).
 *
 * The action is tenant-scoped by design: a customer of Lourdes cannot use the
 * same login form on Gloria's subdomain to slip into Gloria's /me.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // 1. Validate input
  const parsed = loginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
    next:     formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'invalid_credentials' };
  }

  const { email, password, next } = parsed.data;

  // 2. Tenant context (the subdomain the user is browsing)
  const hdrs      = await headers();
  const tenantSlug = hdrs.get('x-tenant-slug') ?? '';
  if (!tenantSlug) return { error: 'generic' };

  // 3. Sign in with Supabase (sets session cookies via SSR client)
  const supabase = await createSupabaseServerClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: 'invalid_credentials' };
  }

  // 4. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'generic' };

  // 5. Resolve org UUID from the current subdomain slug
  const [orgRow] = await db
    .select({ id: organizations.id, slug: organizations.slug })
    .from(organizations)
    .where(eq(organizations.slug, tenantSlug))
    .limit(1);

  if (!orgRow) return { error: 'generic' };

  // 6. Staff first: do they have a `profiles` row in THIS tenant?
  const [staffRow] = await db
    .select({ isActive: profiles.isActive })
    .from(profiles)
    .where(and(eq(profiles.id, user.id), eq(profiles.organizationId, orgRow.id)))
    .limit(1);

  if (staffRow) {
    if (!staffRow.isActive) {
      // Sign out an inactive staff before bouncing.
      await supabase.auth.signOut();
      return { error: 'no_account' };
    }
    redirect(resolveRedirectUrl(next, orgRow.slug, '/dashboard'));
  }

  // 7. Else customer: match by email inside THIS tenant.
  const userEmail = user.email?.toLowerCase();
  if (userEmail) {
    const [customerRow] = await db
      .select({ id: customers.id, isBlocked: customers.isBlocked })
      .from(customers)
      .where(and(eq(customers.organizationId, orgRow.id), eq(customers.email, userEmail)))
      .limit(1);

    if (customerRow) {
      if (customerRow.isBlocked) {
        await supabase.auth.signOut();
        return { error: 'no_account' };
      }
      redirect(resolveRedirectUrl(next, orgRow.slug, '/me'));
    }
  }

  // 8. Credentials are valid but the user does not belong to this tenant.
  //    Sign them out so they don't end up with a stray session and surface a
  //    CTA to /book (copy lives in auth translations).
  await supabase.auth.signOut();
  return { error: 'no_account' };
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Resolves the post-login redirect URL for the given target path
 * (`/dashboard` for staff, `/me` for customers).
 * Validates an optional `next` override against the user's org subdomain to
 * prevent open-redirect abuse.
 */
function resolveRedirectUrl(
  next: string | undefined,
  orgSlug: string,
  defaultPath: '/dashboard' | '/me',
): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt';
  const isLocal    = process.env.NODE_ENV !== 'production';
  const protocol   = isLocal ? 'http' : 'https';
  const host       = isLocal ? `${orgSlug}.lvh.me:3000` : `${orgSlug}.${baseDomain}`;
  const defaultUrl = `${protocol}://${host}${defaultPath}`;

  if (!next) return defaultUrl;

  // Validate: the `next` URL must belong to this org's subdomain
  try {
    const url     = new URL(next);
    const allowed = [
      `${orgSlug}.${baseDomain}`,
      `${orgSlug}.lvh.me`,
    ];
    if (allowed.includes(url.hostname)) return next;
  } catch {
    // Invalid URL — fall through to default
  }

  return defaultUrl;
}
