'use server';

import 'server-only';

import { z } from 'zod';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { idSchema } from '@/shared/lib/id-schema';
import { resolveCalendarStaffForRequest } from '@/domains/organizations/calendar-staff-request';
import { getAvailableHourSlots } from '@/domains/booking/day-view-service';
import { localeFromHeader } from '@/i18n/detect-locale';
import type { Result } from '@/shared/types/result';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.calendar.actions' });
}

// ── Types ────────────────────────────────────────────────────

const inputSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  staffProfileId: idSchema.nullable().optional(),
});

// ── Action ───────────────────────────────────────────────────

/**
 * Returns available hourly slots ("HH:00") for the given date for the resolved
 * staff member. Availability + booked hours are scoped per member: a
 * member-specific rule wins over the org-level rule, and only that member's
 * appointments block slots.
 *
 * The requested member is validated server-side via
 * `resolveCalendarStaffForRequest` — the client-supplied id is never trusted.
 */
export async function getAvailableTimesAction(
  dateStr: string,
  staffProfileId?: string | null,
): Promise<Result<string[]>> {
  const t = await getActionTranslations();

  const parsed = inputSchema.safeParse({ date: dateStr, staffProfileId });
  if (!parsed.success) {
    return { data: null, error: { code: 'VALIDATION_ERROR', message: t('invalidDate') } };
  }

  // Tenant from an active membership in the request's tenant — never from
  // user_metadata. The requested staff id only wins for owner/super_admin
  // and only when it names an active member; staff always resolve to self.
  const auth = await resolveCalendarStaffForRequest(parsed.data.staffProfileId);
  if (!auth.ok) return { data: null, error: { code: 'UNAUTHORIZED', message: auth.message } };

  // Noon UTC keeps day-of-week derivation timezone-safe; the service derives
  // the day window and applies the staff-aware rule/booked-hours filtering.
  const date = new Date(`${parsed.data.date}T12:00:00Z`);
  return getAvailableHourSlots(auth.orgId, date, auth.staffProfileId);
}
