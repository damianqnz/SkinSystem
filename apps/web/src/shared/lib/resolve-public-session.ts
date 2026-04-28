import 'server-only';

import { headers } from 'next/headers';
import { eq, and } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { db } from '@/infrastructure/db';
import { profiles, organizations } from '@/infrastructure/db/schema/organizations';
import { customers } from '@/infrastructure/db/schema/customers';

/**
 * Lightweight session descriptor used by the public (consumer) segment to
 * decide what to render in the navbar `UserMenu`.
 *
 *  - `displayName` — best-effort human name (profile/customer fullName, falls
 *    back to user_metadata.full_name / name, then to the email local part).
 *  - `avatarUrl`   — profile/customer avatar if set, otherwise the Google
 *    OAuth avatar from `user.user_metadata`.
 *  - `accountHref` — where "Mi cuenta" should send the user (`/dashboard`
 *    for staff in this tenant, `/me` for customers in this tenant).
 */
export interface PublicSessionUser {
  displayName: string;
  avatarUrl:   string | null;
  accountHref: '/dashboard' | '/me';
}

/**
 * Resolves the current viewer on the public segment of the active tenant.
 * Returns `null` when nobody is signed in OR the authenticated user does not
 * belong to this tenant (staff OR customer in THIS org). Tenant isolation is
 * enforced exactly like `resolveTenantOrgId()` — via `x-tenant-slug`.
 */
export async function resolvePublicSessionUser(): Promise<PublicSessionUser | null> {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug');
  if (!slug) return null;

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Resolve tenant UUID (scope everything to this org)
  const [orgRow] = await db
    .select({ id: organizations.id })
    .from(organizations)
    .where(eq(organizations.slug, slug))
    .limit(1);
  if (!orgRow) return null;

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const oauthAvatar =
    (typeof meta.avatar_url === 'string' && meta.avatar_url) ||
    (typeof meta.picture    === 'string' && meta.picture) ||
    null;
  const oauthName =
    (typeof meta.full_name === 'string' && meta.full_name) ||
    (typeof meta.name      === 'string' && meta.name) ||
    null;

  // 1. Staff in THIS tenant? (profiles row)
  const [staffRow] = await db
    .select({
      fullName:  profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      isActive:  profiles.isActive,
    })
    .from(profiles)
    .where(and(eq(profiles.id, user.id), eq(profiles.organizationId, orgRow.id)))
    .limit(1);

  if (staffRow && staffRow.isActive) {
    return {
      displayName: staffRow.fullName || oauthName || emailLocalPart(user.email) || '·',
      avatarUrl:   staffRow.avatarUrl || oauthAvatar,
      accountHref: '/dashboard',
    };
  }

  // 2. Customer in THIS tenant? (customers row matched by email)
  const email = user.email?.toLowerCase();
  if (email) {
    const [customerRow] = await db
      .select({
        fullName:  customers.fullName,
        avatarUrl: customers.avatarUrl,
        isBlocked: customers.isBlocked,
      })
      .from(customers)
      .where(and(eq(customers.organizationId, orgRow.id), eq(customers.email, email)))
      .limit(1);

    if (customerRow && !customerRow.isBlocked) {
      return {
        displayName: customerRow.fullName || oauthName || emailLocalPart(user.email) || '·',
        avatarUrl:   customerRow.avatarUrl || oauthAvatar,
        accountHref: '/me',
      };
    }
  }

  // Authenticated but not a member of this tenant → treat navbar as anonymous.
  return null;
}

function emailLocalPart(email: string | undefined | null): string | null {
  if (!email) return null;
  const [local] = email.split('@');
  return local ?? null;
}
