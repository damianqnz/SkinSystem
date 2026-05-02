'use server';

/**
 * @file (dashboard)/dashboard/settings/general/actions.ts
 * @description Per-staff dashboard locale persistence.
 *              Writes both `profiles.locale` (durable cross-device source) and
 *              the `DASHBOARD_LOCALE` cookie (per-browser mirror that the
 *              proxy reads to inject `x-locale` on `/dashboard/*`).
 */

import { revalidatePath }              from 'next/cache';
import { cookies }                     from 'next/headers';
import { z }                           from 'zod';
import { and, eq }                     from 'drizzle-orm';
import { db }                          from '@/infrastructure/db';
import { profiles }                    from '@/infrastructure/db/schema/organizations';
import { resolveTenantOrgId }          from '@/shared/lib/resolve-tenant-org-id';
import type { Result }                 from '@/shared/types/result';

const localeSchema = z.enum(['es', 'pt', 'en']);
export type DashboardLocale = z.infer<typeof localeSchema>;

export async function setDashboardLocaleAction(
  raw: unknown,
): Promise<Result<{ locale: DashboardLocale }>> {
  // 1. Validate (Zod Law)
  const parsed = localeSchema.safeParse(raw);
  if (!parsed.success) {
    return { data: null, error: { message: 'Idioma no válido', code: 'VALIDATION_ERROR' } };
  }
  const locale = parsed.data;

  // 2. Tenant + RBAC (any staff role can change THEIR own preference)
  const auth = await resolveTenantOrgId(['owner', 'staff', 'super_admin']);
  if ('error' in auth) {
    return { data: null, error: { message: auth.error, code: auth.code } };
  }

  // 3. Persist to DB (tenant-isolated)
  await db
    .update(profiles)
    .set({ locale, updatedAt: new Date() })
    .where(and(eq(profiles.id, auth.userId), eq(profiles.organizationId, auth.orgId)));

  // 4. Mirror into the per-browser cookie (matching flags from proxy/login)
  const cookieStore = await cookies();
  cookieStore.set('DASHBOARD_LOCALE', locale, {
    path:     '/',
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   60 * 60 * 24 * 365,
  });

  // 5. Re-render the dashboard tree with the new x-locale header
  revalidatePath('/dashboard', 'layout');

  return { data: { locale }, error: null };
}
