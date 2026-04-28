'use server';

import { z } from 'zod';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import { buildSlotKey, lockSlot, unlockSlot } from '@/shared/lib/redis-lock';

// ── Schema ────────────────────────────────────────────────────

const lockSlotInputSchema = z.object({
  organizationId: z.string().uuid(),
  serviceId:      z.string().uuid(),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),  // "YYYY-MM-DD"
  startISO:       z.string().datetime(),
});

const unlockSlotInputSchema = z.object({
  organizationId: z.string().uuid(),
  serviceId:      z.string().uuid(),
  date:           z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startISO:       z.string().datetime(),
});

// ── State type ────────────────────────────────────────────────

export type LockSlotState =
  | { status: 'idle' }
  | { status: 'success'; ttlSeconds: number }
  | { status: 'conflict' }             // slot already locked
  | { status: 'error'; message: string };

// ── Actions ───────────────────────────────────────────────────

/**
 * lockSlotAction — Server Action.
 *
 * Acquires a 5-minute Redis lock on a slot for the current user's session.
 * Uses SET NX EX (atomic) — guarantees at-most-one lock holder.
 * Session ID derived from Supabase user.id (not spoofable from client).
 */
export async function lockSlotAction(
  _prev: LockSlotState,
  raw:   unknown,
): Promise<LockSlotState> {
  const parsed = lockSlotInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'No autorizado' };

  const { organizationId, serviceId, date, startISO } = parsed.data;
  const key = buildSlotKey(organizationId, date, startISO, serviceId);

  try {
    const acquired = await lockSlot(key, user.id, 300);
    if (!acquired) return { status: 'conflict' };
    return { status: 'success', ttlSeconds: 300 };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al bloquear slot';
    return { status: 'error', message: msg };
  }
}

/**
 * unlockSlotAction — Server Action.
 * Releases a Redis lock. Only succeeds if the caller owns the lock.
 */
export async function unlockSlotAction(
  _prev: LockSlotState,
  raw:   unknown,
): Promise<LockSlotState> {
  const parsed = unlockSlotInputSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: 'Datos inválidos' };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'No autorizado' };

  const { organizationId, serviceId, date, startISO } = parsed.data;
  const key = buildSlotKey(organizationId, date, startISO, serviceId);

  try {
    await unlockSlot(key, user.id);
    return { status: 'idle' };
  } catch {
    return { status: 'error', message: 'Error al liberar slot' };
  }
}
