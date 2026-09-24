'use server';
import 'server-only';

import { eq, and }            from 'drizzle-orm';
import { revalidatePath }     from 'next/cache';
import { createServerClient } from '@supabase/ssr';
import { cookies, headers }   from 'next/headers';
import { getTranslations }    from 'next-intl/server';
import { db }                 from '@/infrastructure/db';
import { profiles } from '@/infrastructure/db/schema/organizations';
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
  const jar  = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: { getAll: () => jar.getAll(), setAll: (pairs) => pairs.forEach(({ name, value, options }) => jar.set(name, value, options)) } },
  );

  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  const t = await getActionTranslations();
  if (authErr || !user) return { data: null, error: { message: t('unauthorized'), code: 'UNAUTHORIZED' } };

  let orgId = user.user_metadata?.organization_id as string | undefined;
  // Fallback: profiles table (profiles.id === auth.users.id)
  if (!orgId) {
    const profileRows = await db.select({ organizationId: profiles.organizationId })
      .from(profiles).where(eq(profiles.id, user.id)).limit(1);
    orgId = profileRows[0]?.organizationId;
  }
    if (!orgId) return { data: null, error: { message: t('noOrganization'), code: 'UNAUTHORIZED' } };

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
