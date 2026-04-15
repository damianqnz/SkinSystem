'use server';

import { z } from 'zod';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import { saveCustomerRoutine, saveRoutineSchema } from '@/domains/customers/service-routines';

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
  // 1. Validate input
  const parsed = saveRoutineSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos.' };
  }

  // 2. Auth — get profile id from session (prevents spoofing)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'No autorizado.' };

  // 3. Persist
  const result = await saveCustomerRoutine(parsed.data, user.id);
  if (result.error) return { status: 'error', message: result.error.message };

  return { status: 'success', routineId: result.data.id };
}
