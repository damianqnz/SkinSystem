'use server';

import { headers }                      from 'next/headers';
import { eq, and }                      from 'drizzle-orm';
import { createSupabaseServerClient }   from '@/infrastructure/supabase/server';
import { db }                           from '@/infrastructure/db';
import { profiles }                     from '@/infrastructure/db/schema/organizations';
import { getOrganizationBySlug }        from '@/domains/organizations/service';

// ── Types ─────────────────────────────────────────────────────

/** Valid roles in `profiles.role` (mirror of `userRoleEnum`). */
export type UserRole = 'super_admin' | 'owner' | 'staff';

/** Any of these roles = legitimate dashboard user. */
export const STAFF_ROLES: readonly UserRole[] = ['super_admin', 'owner', 'staff'];

/** Discriminant telling callers exactly WHY they were rejected — so layouts can
 *  choose the right redirect (unauth → /login, customer → /me, etc.). */
export type ResolveTenantError =
  | 'NO_TENANT'        // no x-tenant-slug header
  | 'NO_AUTH'          // no Supabase session
  | 'ORG_NOT_FOUND'    // slug doesn't match any organization
  | 'NOT_MEMBER'       // authenticated, but no profiles row for this org (likely a customer)
  | 'INACTIVE'         // staff row exists but is_active = false
  | 'FORBIDDEN';       // role exists but isn't in the requiredRoles allow-list

export type ResolveTenantOk = {
  orgId:  string;
  userId: string;
  role:   UserRole;
};

export type ResolveTenantResult =
  | ResolveTenantOk
  | { error: string; code: ResolveTenantError };

// ── Helper ────────────────────────────────────────────────────

/**
 * Tenant-scoped + role-aware resolver used by every dashboard Server Action
 * and by the `(dashboard)/layout.tsx` gate.
 *
 * Single source of truth: the `x-tenant-slug` header injected by
 * `proxy.ts` from the current subdomain. This enforces tenant isolation
 * by the subdomain the user is actually browsing, not by whatever
 * `user_metadata.organization_id` or `profiles.id` happens to point to.
 *
 * Flow:
 *   1. Read `x-tenant-slug` from request headers (canonical per
 *      ARCHITECTURE.md §3.1).
 *   2. Verify the caller is authenticated via Supabase SSR.
 *   3. Resolve the org UUID from the slug.
 *   4. Confirm the authenticated user has a `profiles` row scoped to
 *      *this* org (= they are staff here). Customers have no profile row,
 *      so this also cleanly rejects end-users trying to access `/dashboard`.
 *   5. (Optional) Enforce a role allow-list — e.g. owner-only endpoints.
 *
 * @param requiredRoles Roles allowed to pass. Defaults to any staff role
 *                      (`super_admin | owner | staff`). Pass `['owner','super_admin']`
 *                      for sensitive operations (billing owner actions, org deletion…).
 */
export async function resolveTenantOrgId(
  requiredRoles: readonly UserRole[] = STAFF_ROLES,
): Promise<ResolveTenantResult> {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug');
  if (!slug) return { error: 'Tenant no identificado', code: 'NO_TENANT' };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado', code: 'NO_AUTH' };

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) {
    return { error: 'Organización no encontrada', code: 'ORG_NOT_FOUND' };
  }
  const orgId = orgResult.data.id;

  // Defense in depth: the authenticated user must belong to THIS org as staff.
  // Customers live in `public.customers` (email-keyed, no FK to auth.users) and
  // therefore never have a `profiles` row — this check alone rejects them.
  const rows = await db
    .select({ role: profiles.role, isActive: profiles.isActive })
    .from(profiles)
    .where(and(eq(profiles.id, user.id), eq(profiles.organizationId, orgId)))
    .limit(1);

  const profile = rows[0];
  if (!profile)          return { error: 'Acceso no permitido a este tenant', code: 'NOT_MEMBER' };
  if (!profile.isActive) return { error: 'Cuenta inactiva',                   code: 'INACTIVE' };

  const role = profile.role as UserRole;
  if (!requiredRoles.includes(role)) {
    return { error: 'Permisos insuficientes', code: 'FORBIDDEN' };
  }

  return { orgId, userId: user.id, role };
}
