'use server';

import 'server-only';

import { z } from 'zod';
import { and, eq, gte, lt, not, inArray } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { db }              from '@/infrastructure/db';
import { appointments }    from '@/domains/booking/schema';
import { catalogServices } from '@/infrastructure/db/schema/catalog';
import { blockedIntervals } from '@/infrastructure/db/schema/calendar';
import { resolveCalendarStaffForRequest } from '@/domains/organizations/calendar-staff-request';
import { idSchema } from '@/shared/lib/id-schema';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { localeFromHeader } from '@/i18n/detect-locale';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.calendar.actions' });
}

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
  staffProfileId: idSchema.nullable().optional(),
});

// ── Action ───────────────────────────────────────────────────

/**
 * Blocks a date range (inclusive) for the resolved staff member.
 * Aborts if any non-cancelled appointment for that member falls within the
 * range. orgId always derived from the caller's active membership in the
 * tenant; the member is the owner/super_admin-selected active member or self.
 */
export async function blockDaysAction(
  fromDate: string,
  toDate:   string,
  reason:   string,
  staffProfileId?: string | null,
): Promise<BlockDaysState> {
  const t = await getActionTranslations();

  const parsed = blockDaysSchema.safeParse({ fromDate, toDate, reason, staffProfileId });
  if (!parsed.success) return { status: 'error', message: t('invalidData') };

  // Tenant from an active membership in the request's tenant — never from
  // user_metadata. The requested staff id only wins for owner/super_admin
  // and only when it names an active member; staff always resolve to self.
  const auth = await resolveCalendarStaffForRequest(parsed.data.staffProfileId);
  if (!auth.ok) return { status: 'error', message: auth.message };
  const { orgId, staffProfileId: targetProfileId } = auth;

  const { fromDate: from, toDate: to, reason: blockReason } = parsed.data;
  if (to < from) return { status: 'error', message: t('endDateBeforeStart') };

  const rangeStart = new Date(`${from}T00:00:00Z`);
  const rangeEnd   = new Date(`${to}T23:59:59.999Z`);

  try {
    // 1. Conflict check — appointments not cancelled/no_show in range
    const conflicts = await db
      .select({ startAt: appointments.startAt, nameI18n: catalogServices.nameI18n })
      .from(appointments)
      .innerJoin(catalogServices, and(
        eq(appointments.serviceId, catalogServices.id),
        eq(catalogServices.organizationId, appointments.organizationId),
      ))
      .where(and(
        eq(appointments.organizationId, orgId),
        eq(appointments.staffProfileId, targetProfileId),
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
        profileId:        targetProfileId,
        startAt:          new Date(`${d}T00:00:00Z`),
        endAt:            new Date(`${d}T23:59:59.999Z`),
        reason:           blockReason,
        recurrenceType:   'none' as const,
        recurrenceConfig: {},
        isActive:         true,
      })),
    );

    revalidatePath('/dashboard/calendar');
    return { status: 'success', blockedDays: days.length };

  } catch {
    return { status: 'error', message: t('blockDaysFailed') };
  }
}
