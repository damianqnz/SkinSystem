'use server';

import 'server-only';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and, lt, gt, inArray } from 'drizzle-orm';

import { db } from '@/infrastructure/db';
import { appointments } from '@/domains/booking/schema';
import { customers }    from '@/infrastructure/db/schema/customers';
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
  staffProfileId: idSchema.nullable().optional(),
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
  const t = await getActionTranslations();

  const staffRaw = formData.get('staffProfileId');

  // Validate form fields
  const parsed = blockSchema.safeParse({
    date:      formData.get('date'),
    startTime: formData.get('startTime'),
    endTime:   formData.get('endTime'),
    reason:    formData.get('reason'),
    staffProfileId: typeof staffRaw === 'string' && staffRaw.length > 0 ? staffRaw : null,
  });
  if (!parsed.success) {
    // Deliberately NOT `issues[0].message`: this schema carries no custom
    // messages, so Zod's own text is English and would reach the toast.
    return { status: 'error', message: t('invalidData') };
  }

  // Tenant from an active membership in the request's tenant — never from
  // user_metadata. The requested staff id only wins for owner/super_admin
  // and only when it names an active member; staff always resolve to self.
  const auth = await resolveCalendarStaffForRequest(parsed.data.staffProfileId);
  if (!auth.ok) return { status: 'error', message: auth.message };
  const { orgId, staffProfileId } = auth;

  const { date, startTime, endTime, reason } = parsed.data;
  const startAt = buildTs(date, startTime);
  const endAt   = buildTs(date, endTime);

  if (endAt <= startAt) {
    return { status: 'error', message: t('endTimeBeforeStart') };
  }

  try {
    // Overlap check: appointment starts before block ends AND ends after block starts
    // i.e. any appointment whose interval intersects [startAt, endAt]
    const conflicts = await db
      .select({ startAt: appointments.startAt, customerName: customers.fullName })
      .from(appointments)
      .innerJoin(customers, and(eq(appointments.customerId, customers.id), eq(customers.organizationId, appointments.organizationId)))
      .where(and(
        eq(appointments.organizationId, orgId),
        eq(appointments.staffProfileId, staffProfileId),
        inArray(appointments.status, [...ACTIVE]),
        lt(appointments.startAt, endAt),    // appt starts before block ends
        gt(appointments.endAt,   startAt),  // appt ends after block starts
      ))
      .limit(1);

    if (conflicts[0]) {
      const time = conflicts[0].startAt.toISOString().slice(11, 16);
      return {
        status: 'error',
        message: t('conflictExists', { time, name: conflicts[0].customerName }),
      };
    }

    // No conflict → insert blocked interval
    await db.insert(blockedIntervals).values({
      organizationId:   orgId,
      profileId:        staffProfileId,
      startAt,
      endAt,
      reason,
      recurrenceType:   'none',
      recurrenceConfig: {},
      isActive:         true,
    });

    revalidatePath('/dashboard/calendar');
    return { status: 'success' };

  } catch {
    return { status: 'error', message: t('blockTimeFailed') };
  }
}
