'use server';

import 'server-only';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and, lt, gt, inArray } from 'drizzle-orm';

import { db } from '@/infrastructure/db';
import { appointments } from '@/domains/booking/schema';
import { customers }    from '@/infrastructure/db/schema/customers';
import { blockedIntervals } from '@/infrastructure/db/schema/calendar';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';

// ── State ────────────────────────────────────────────────────

export type BlockTimeState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

// ── Schema ───────────────────────────────────────────────────

const blockSchema = z.object({
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}$/),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/),
  reason:    z.enum(['illness', 'vacation', 'training', 'other']),
});

const ACTIVE = ['pending', 'confirmed'] as const;

function buildTs(date: string, time: string): Date {
  return new Date(`${date}T${time}:00Z`);
}

// ── Action ───────────────────────────────────────────────────

export async function blockTimeAction(
  _prev: BlockTimeState,
  formData: FormData,
): Promise<BlockTimeState> {

  // Auth — orgId ALWAYS from session (not spoofable from client)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'No autorizado' };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { status: 'error', message: 'Organización no encontrada' };

  // Validate form fields
  const parsed = blockSchema.safeParse({
    date:      formData.get('date'),
    startTime: formData.get('startTime'),
    endTime:   formData.get('endTime'),
    reason:    formData.get('reason'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { date, startTime, endTime, reason } = parsed.data;
  const startAt = buildTs(date, startTime);
  const endAt   = buildTs(date, endTime);

  if (endAt <= startAt) {
    return { status: 'error', message: 'La hora final debe ser posterior a la inicial' };
  }

  try {
    // Overlap check: appointment starts before block ends AND ends after block starts
    // i.e. any appointment whose interval intersects [startAt, endAt]
    const conflicts = await db
      .select({ startAt: appointments.startAt, customerName: customers.fullName })
      .from(appointments)
      .innerJoin(customers, eq(appointments.customerId, customers.id))
      .where(and(
        eq(appointments.organizationId, orgId),
        inArray(appointments.status, [...ACTIVE]),
        lt(appointments.startAt, endAt),    // appt starts before block ends
        gt(appointments.endAt,   startAt),  // appt ends after block starts
      ))
      .limit(1);

    if (conflicts[0]) {
      const hora = conflicts[0].startAt.toISOString().slice(11, 16);
      return {
        status: 'error',
        message: `Existe una reserva: ${hora} — ${conflicts[0].customerName}`,
      };
    }

    // No conflict → insert blocked interval
    await db.insert(blockedIntervals).values({
      organizationId:   orgId,
      profileId:        user.id,
      startAt,
      endAt,
      reason,
      recurrenceType:   'none',
      recurrenceConfig: {},
      isActive:         true,
    });

    revalidatePath('/calendar');
    return { status: 'success' };

  } catch {
    return { status: 'error', message: 'Error al bloquear horario' };
  }
}
