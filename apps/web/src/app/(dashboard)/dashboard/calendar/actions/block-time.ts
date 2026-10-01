'use server';

import 'server-only';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { eq, and, lt, gt, inArray } from 'drizzle-orm';

import { db } from '@/infrastructure/db';
import { appointments } from '@/domains/booking/schema';
import { customers }    from '@/infrastructure/db/schema/customers';
import { blockedIntervals } from '@/infrastructure/db/schema/calendar';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
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

  // Tenant from an active membership in the request's tenant — never from
  // user_metadata, which the signed-in user can rewrite via the Auth API.
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };
  const { orgId, userId } = auth;

  // Validate form fields
  const parsed = blockSchema.safeParse({
    date:      formData.get('date'),
    startTime: formData.get('startTime'),
    endTime:   formData.get('endTime'),
    reason:    formData.get('reason'),
  });
  if (!parsed.success) {
    // Deliberately NOT `issues[0].message`: this schema carries no custom
    // messages, so Zod's own text is English and would reach the toast.
    return { status: 'error', message: t('invalidData') };
  }

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
      profileId:        userId,
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
