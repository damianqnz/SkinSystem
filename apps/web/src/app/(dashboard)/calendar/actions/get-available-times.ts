'use server';

import 'server-only';

import { z } from 'zod';
import { and, eq, gte, lt, inArray, isNull } from 'drizzle-orm';
import { db }                        from '@/infrastructure/db';
import { availabilityRules }         from '@/infrastructure/db/schema/calendar';
import { appointments }              from '@/domains/booking/schema';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import type { Result }               from '@/shared/types/result';

// ── Types ────────────────────────────────────────────────────

const ACTIVE_STATUSES = ['pending', 'confirmed'] as const;

const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
});

// ── Action ───────────────────────────────────────────────────

/**
 * Returns available hourly slots ("HH:MM") for the given date within this org.
 * - Reads org-level availability_rules for the day of week.
 * - Excludes hours occupied by active appointments.
 * - orgId derived exclusively from user.user_metadata (not spoofable).
 */
export async function getAvailableTimesAction(dateStr: string): Promise<Result<string[]>> {
  const parsed = inputSchema.safeParse({ date: dateStr });
  if (!parsed.success) {
    return { data: null, error: { code: 'VALIDATION_ERROR', message: 'Fecha inválida' } };
  }

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const orgId = user?.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { code: 'UNAUTHORIZED', message: 'No autorizado' } };

  const { date } = parsed.data;
  // Use noon UTC to safely derive day-of-week regardless of timezone offset
  const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();

  // 1. Org-level availability rule for this day (profileId IS NULL)
  const [rule] = await db
    .select({
      openTime:  availabilityRules.openTime,
      closeTime: availabilityRules.closeTime,
      isActive:  availabilityRules.isActive,
    })
    .from(availabilityRules)
    .where(and(
      eq(availabilityRules.organizationId, orgId),
      eq(availabilityRules.dayOfWeek, dayOfWeek),
      isNull(availabilityRules.profileId),
    ))
    .limit(1);

  if (!rule?.isActive) return { data: [], error: null };

  // 2. Appointments for this date with active statuses
  const dayStart = new Date(`${date}T00:00:00Z`);
  const dayEnd   = new Date(`${date}T23:59:59.999Z`);

  const booked = await db
    .select({ startAt: appointments.startAt })
    .from(appointments)
    .where(and(
      eq(appointments.organizationId, orgId),
      gte(appointments.startAt, dayStart),
      lt(appointments.startAt, dayEnd),
      inArray(appointments.status, [...ACTIVE_STATUSES]),
    ));

  const bookedHours = new Set(booked.map((a) => a.startAt.getUTCHours()));

  // 3. Generate hourly slots between open and close times
  const openH  = parseInt(rule.openTime.slice(0, 2),  10);
  const closeH = parseInt(rule.closeTime.slice(0, 2), 10);
  const slots: string[] = [];
  for (let h = openH; h < closeH; h++) {
    if (!bookedHours.has(h)) slots.push(`${String(h).padStart(2, '0')}:00`);
  }

  return { data: slots, error: null };
}
