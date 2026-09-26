'use server';
import 'server-only';

import { resolveTenantOrgId }            from '@/shared/lib/resolve-tenant-org-id';
import { getCustomerAppointmentHistory } from '@/domains/customers/service-appointments';
import type { Result }              from '@/shared/types/result';
import type { AppointmentHistoryData } from '@/domains/customers/service-appointments';

export async function getCustomerAppointmentsAction(
  customerId: string,
): Promise<Result<AppointmentHistoryData>> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: auth.code } };

  return getCustomerAppointmentHistory(auth.orgId, customerId);
}
