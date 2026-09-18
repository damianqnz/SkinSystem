'use server';

import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
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
 * Security: reads the authenticated user from Supabase session.
 * The specialist's profile ID is derived from auth, not from the client.
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

  // 2. Auth — get profile id from session (prevents spoofing)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: t('unauthorized') };

  // 3. Persist
  const result = await saveCustomerRoutine(parsed.data, user.id);
  if (result.error) return { status: 'error', message: result.error.message };

  return { status: 'success', routineId: result.data.id };
}
