'use server';
import 'server-only';

import { eq }                            from 'drizzle-orm';
import { createServerClient }            from '@supabase/ssr';
import { cookies, headers }              from 'next/headers';
import { getTranslations }               from 'next-intl/server';
import { db }                            from '@/infrastructure/db';
import { profiles }                      from '@/infrastructure/db/schema/organizations';
import { getCustomerAppointmentHistory } from '@/domains/customers/service-appointments';
import { localeFromHeader }              from '@/i18n/detect-locale';
import type { Result }              from '@/shared/types/result';
import type { AppointmentHistoryData } from '@/domains/customers/service-appointments';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.actions' });
}

export async function getCustomerAppointmentsAction(
  customerId: string,
): Promise<Result<AppointmentHistoryData>> {
  const jar = await cookies();
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

  return getCustomerAppointmentHistory(orgId, customerId);
}
