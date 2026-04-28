'use server';

import { headers }                      from 'next/headers';
import { eq, and }                      from 'drizzle-orm';
import { createSupabaseServerClient }   from '@/infrastructure/supabase/server';
import { db }                           from '@/infrastructure/db';
import { profiles }                     from '@/infrastructure/db/schema/organizations';
import { getOrganizationBySlug }        from '@/domains/organizations/service';
import {
  STAFF_ROLES,
  type UserRole,
  type ResolveTenantResult,
} from '@/shared/lib/resolve-tenant-types';

/**
 * Tenant-scoped + role-aware resolver used by every dashboard Server Action
 * and by the `(dashboard)/layout.tsx` gate.
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
