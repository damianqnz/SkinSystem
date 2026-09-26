'use server';
import 'server-only';

import { eq, and, not }       from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { headers }            from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { db }                 from '@/infrastructure/db';
import { customers }          from '@/infrastructure/db/schema/customers';
import { localeFromHeader }   from '@/i18n/detect-locale';
import type { Result }        from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

export async function toggleBlockCustomerAction(
  customerId: string,
): Promise<Result<{ isBlocked: boolean }>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };
  const orgId = auth.orgId;

  const t = await getActionTranslations();

  const rows = await db
    .update(customers)
    .set({ isBlocked: not(customers.isBlocked) })
    .where(and(eq(customers.id, customerId), eq(customers.organizationId, orgId)))
    .returning({ isBlocked: customers.isBlocked });

  if (!rows[0]) return { data: null, error: { message: t('customerNotFound'), code: 'NOT_FOUND' } };

  revalidatePath(`/dashboard/customers/${customerId}`);
  revalidatePath('/dashboard/customers');
  return { data: { isBlocked: rows[0].isBlocked }, error: null };
}
