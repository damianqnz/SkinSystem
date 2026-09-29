'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { resolveTenantOrgId }          from '@/shared/lib/resolve-tenant-org-id';
import { saveCustomerRoutine, saveRoutineSchema } from '@/domains/customers/service-routines';
import { localeFromHeader } from '@/i18n/detect-locale';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.customers.routine.actions' });
}

export type SaveRoutineState =
  | { status: 'idle' }
  | { status: 'success'; routineId: string }
  | { status: 'error'; message: string };

/**
 * saveRoutineAction — Server Action.
 * Security: the tenant and the specialist's profile ID both come from the
 * caller's active membership, never from the client payload.
 */
export async function saveRoutineAction(
  _prev: SaveRoutineState,
  raw: unknown,
): Promise<SaveRoutineState> {
  const t = await getActionTranslations();

  // 1. Validate input
  const parsed = saveRoutineSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  // 2. Auth — tenant membership, not a client-supplied organizationId
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  // 3. Persist
  const result = await saveCustomerRoutine(parsed.data, auth.orgId, auth.userId);
  if (result.error) {
    return {
      status: 'error',
      message: result.error.code === 'NOT_FOUND' ? t('customerNotFound') : result.error.message,
    };
  }

  return { status: 'success', routineId: result.data.id };
}
