'use server';

import { headers }                      from 'next/headers';
import { eq, and }                      from 'drizzle-orm';
import { getTranslations }              from 'next-intl/server';
import { localeFromHeader }             from '@/i18n/detect-locale';
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
  const t    = await getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.shared.tenantAuth' });

  const slug = hdrs.get('x-tenant-slug');
  if (!slug) return { error: t('noTenant'), code: 'NO_TENANT' };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: t('notAuthenticated'), code: 'NO_AUTH' };

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) {
    return { error: t('orgNotFound'), code: 'ORG_NOT_FOUND' };
  }
  const orgId = orgResult.data.id;

  const rows = await db
    .select({ role: profiles.role, isActive: profiles.isActive, locale: profiles.locale })
    .from(profiles)
    .where(and(eq(profiles.id, user.id), eq(profiles.organizationId, orgId)))
    .limit(1);

  const profile = rows[0];
  if (!profile)          return { error: t('notMember'), code: 'NOT_MEMBER' };
  if (!profile.isActive) return { error: t('inactive'),  code: 'INACTIVE' };

  const role = profile.role as UserRole;
  if (!requiredRoles.includes(role)) {
    return { error: t('forbidden'), code: 'FORBIDDEN' };
  }

  return {
    orgId,
    userId: user.id,
    role,
    profileLocale: profile.locale,
    orgLocale: orgResult.data.locale,
  };
}
