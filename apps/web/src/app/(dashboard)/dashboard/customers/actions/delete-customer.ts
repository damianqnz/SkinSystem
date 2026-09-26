'use server';
import 'server-only';

import { eq, and }            from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { headers }            from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { appointments }       from '@/infrastructure/db/schema/booking';
import { localeFromHeader }   from '@/i18n/detect-locale';
import type { Result }        from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

export async function deleteCustomerAction(
  customerId: string,
): Promise<Result<void>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };
  const orgId = auth.orgId;

  const t = await getActionTranslations();

  // Guard: check for existing appointments (financial integrity)
  const apptRows = await db
    .select({ id: appointments.id })
    .from(appointments)
    .where(and(eq(appointments.customerId, customerId), eq(appointments.organizationId, orgId)))
    .limit(1);

  if (apptRows.length > 0) {
    return {
      data: null,
      error: {
        message: t('hasAppointments'),
        code: 'HAS_APPOINTMENTS',
      },
    };
  }

  await db.delete(customers)
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)));

  revalidatePath('/dashboard/customers');
  return { data: undefined, error: null };
}
