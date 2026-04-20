'use server';

import 'server-only';

import { z } from 'zod';
import { and, eq, gte, lt, not, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db }              from '@/infrastructure/db';
import { appointments }    from '@/domains/booking/schema';
import { catalogServices } from '@/infrastructure/db/schema/catalog';
import { blockedIntervals } from '@/infrastructure/db/schema/calendar';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';

// ── Types ────────────────────────────────────────────────────

export type BlockDaysConflict = { date: string; time: string; serviceName: string };

export type BlockDaysState =
  | { status: 'idle' }
  | { status: 'success'; blockedDays: number }
  | { status: 'conflict'; conflicts: BlockDaysConflict[] }
  | { status: 'error'; message: string };

// ── Schema ───────────────────────────────────────────────────

const blockDaysSchema = z.object({
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:   z.enum(['vacation', 'illness', 'training', 'other']),
});

// ── Action ───────────────────────────────────────────────────

/**
 * Blocks a date range (inclusive) for the org.
 * Aborts if any non-cancelled appointment falls within the range.
 * orgId always derived from user.user_metadata (not spoofable).
 */
export async function blockDaysAction(
  fromDate: string,
  toDate:   string,
  reason:   string,
): Promise<BlockDaysState> {
  const parsed = blockDaysSchema.safeParse({ fromDate, toDate, reason });
  if (!parsed.success) return { status: 'error', message: 'Datos inválidos' };

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { status: 'error', message: 'No autorizado' };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { status: 'error', message: 'Organización no encontrada' };

  const { fromDate: from, toDate: to, reason: blockReason } = parsed.data;
  if (to < from) return { status: 'error', message: '"Hasta" debe ser posterior a "Desde"' };

  const rangeStart = new Date(`${from}T00:00:00Z`);
  const rangeEnd   = new Date(`${to}T23:59:59.999Z`);

  try {
    // 1. Conflict check — appointments not cancelled/no_show in range
    const conflicts = await db
      .select({ startAt: appointments.startAt, nameI18n: catalogServices.nameI18n })
      .from(appointments)
      .innerJoin(catalogServices, eq(appointments.serviceId, catalogServices.id))
      .where(and(
        eq(appointments.organizationId, orgId),
        not(inArray(appointments.status, ['cancelled', 'no_show'])),
        gte(appointments.startAt, rangeStart),
        lt(appointments.startAt, rangeEnd),
      ));

    if (conflicts.length > 0) {
      return {
        status: 'conflict',
        conflicts: conflicts.map((c) => {
          const nameMap = (c.nameI18n ?? {}) as Record<string, string>;
          return {
            date:        c.startAt.toISOString().slice(0, 10),
            time:        c.startAt.toISOString().slice(11, 16),
            serviceName: nameMap.es ?? nameMap.pt ?? nameMap.en ?? '—',
          };
        }),
      };
    }

    // 2. Generate one blocked_intervals row per day in the range
    const days: string[] = [];
    const cursor = new Date(rangeStart);
    while (cursor <= rangeEnd) {
      days.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    await db.insert(blockedIntervals).values(
      days.map((d) => ({
        organizationId:   orgId,
        profileId:        user.id,
        startAt:          new Date(`${d}T00:00:00Z`),
        endAt:            new Date(`${d}T23:59:59.999Z`),
        reason:           blockReason,
        recurrenceType:   'none' as const,
        recurrenceConfig: {},
        isActive:         true,
      })),
    );

    revalidatePath('/dashboard/agenda');
    return { status: 'success', blockedDays: days.length };

  } catch {
    return { status: 'error', message: 'Error al bloquear los días' };
  }
}
