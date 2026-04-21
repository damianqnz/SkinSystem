'use server';
import 'server-only';

import { createServerClient } from '@supabase/ssr';
import { cookies }            from 'next/headers';
import { getCustomerAppointmentHistory } from '@/domains/customers/service-appointments';
import type { Result }              from '@/shared/types/result';
import type { AppointmentHistoryData } from '@/domains/customers/service-appointments';

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
  if (authErr || !user) return { data: null, error: { message: 'Unauthorized', code: 'UNAUTHORIZED' } };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: 'No organization', code: 'UNAUTHORIZED' } };

  return getCustomerAppointmentHistory(orgId, customerId);
}
