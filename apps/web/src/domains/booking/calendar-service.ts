import 'server-only';

import { eq, and, between, asc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { appointments } from './schema';
import { catalogServices } from '@/domains/catalog/schema';
import { customers } from '@/infrastructure/db/schema/customers';
import { blockedIntervals } from '@/infrastructure/db/schema/calendar';
import type { Result } from '@/shared/types/result';

// ── Block-reason enum (mirrored locally for safe Zod validation) ──
export const BLOCK_REASONS = ['vacation', 'illness', 'training', 'other'] as const;
export type BlockReason = (typeof BLOCK_REASONS)[number];

// ── Types ─────────────────────────────────────────────────────

export type CalendarEvent = {
  id:                  string;
  customerId:          string;
  customerName:        string;
  serviceId:           string;
  serviceName:         Record<string, string>;  // nameI18n JSONB
  serviceColor:        string | null;
  durationMinutes:     number;
  bufferBeforeMinutes: number;
  bufferAfterMinutes:  number;
  startAt:             Date;
  endAt:               Date;
  status:              string;
  totalCents:          number;
};

export type CalendarWeek = {
  events:    CalendarEvent[];
  weekStart: Date;  // Monday 00:00:00 UTC
  weekEnd:   Date;  // Sunday 23:59:59 UTC
};

export type CalendarMonth = {
  events:     CalendarEvent[];
  /** Monday on/before the 1st (visible top-left of the grid) */
  gridStart:  Date;
  /** Sunday on/after the last day (visible bottom-right of the grid) */
  gridEnd:    Date;
  /** First day of the displayed month (UTC) */
  monthStart: Date;
};

// ── Helpers ───────────────────────────────────────────────────

/** Returns the Monday of the week containing `date` at midnight UTC. */
export function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getUTCDay(); // 0=Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + diff);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Returns Sunday 23:59:59.999 of the same week as `weekStart`. */
export function getWeekEnd(weekStart: Date): Date {
  const d = new Date(weekStart);
  d.setUTCDate(d.getUTCDate() + 6);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

/** First day of `date`'s month, at UTC midnight. */
export function getMonthStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/**
 * Visible grid bounds for a monthly calendar view.
 * Returns the Monday on/before day-1 of the month and the Sunday on/after the
 * last day of the month — always 42 days (6 weeks) covered.
 */
export function getMonthGridBounds(date: Date): { gridStart: Date; gridEnd: Date } {
  const monthStart = getMonthStart(date);
  const gridStart  = getWeekStart(monthStart);

  const monthEnd = new Date(monthStart);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  monthEnd.setUTCDate(0);                  // last day of original month
  monthEnd.setUTCHours(23, 59, 59, 999);

  const gridEnd  = getWeekEnd(getWeekStart(monthEnd));
  return { gridStart, gridEnd };
}

const dbErr = (m: string): Result<never> =>
  ({ data: null, error: { message: m, code: 'DB_ERROR' } });

// ── Service ───────────────────────────────────────────────────

/**
 * Returns all appointments for the 7-day window starting on the Monday
 * of the week that contains `anchorDate`, joined with customer and service data.
 * Tenant-isolated by `organizationId`.
 */
export async function getCalendarWeek(
  organizationId: string,
  anchorDate: Date,
): Promise<Result<CalendarWeek>> {
  const weekStart = getWeekStart(anchorDate);
  const weekEnd   = getWeekEnd(weekStart);

  try {
    const rows = await db
      .select({
        id:                  appointments.id,
        customerId:          appointments.customerId,
        customerFullName:    customers.fullName,
        serviceId:           appointments.serviceId,
        serviceNameI18n:     catalogServices.nameI18n,
        serviceColor:        catalogServices.color,
        durationMinutes:     catalogServices.durationMinutes,
        bufferBeforeMinutes: catalogServices.bufferBeforeMinutes,
        bufferAfterMinutes:  catalogServices.bufferAfterMinutes,
        startAt:             appointments.startAt,
        endAt:               appointments.endAt,
        status:              appointments.status,
        totalCents:          appointments.totalCents,
      })
      .from(appointments)
      .innerJoin(customers,       eq(appointments.customerId,  customers.id))
      .innerJoin(catalogServices, eq(appointments.serviceId,   catalogServices.id))
      .where(and(
        eq(appointments.organizationId, organizationId),
        between(appointments.startAt, weekStart, weekEnd),
      ))
      .orderBy(asc(appointments.startAt));

    const events: CalendarEvent[] = rows.map((r) => ({
      id:                  r.id,
      customerId:          r.customerId,
      customerName:        r.customerFullName ?? '—',
      serviceId:           r.serviceId,
      serviceName:         (r.serviceNameI18n as Record<string, string>) ?? {},
      serviceColor:        r.serviceColor,
      durationMinutes:     r.durationMinutes,
      bufferBeforeMinutes: r.bufferBeforeMinutes,
      bufferAfterMinutes:  r.bufferAfterMinutes,
      startAt:             r.startAt,
      endAt:               r.endAt,
      status:              r.status,
      totalCents:          r.totalCents,
    }));

    return { data: { events, weekStart, weekEnd }, error: null };
  } catch {
    return dbErr('Failed to fetch calendar week');
  }
}

// ── Month query ───────────────────────────────────────────────

/**
 * Returns every appointment overlapping the visible 6-week grid for
 * the month containing `anchorDate`. Tenant-isolated.
 */
export async function getCalendarMonth(
  organizationId: string,
  anchorDate: Date,
): Promise<Result<CalendarMonth>> {
  const monthStart = getMonthStart(anchorDate);
  const { gridStart, gridEnd } = getMonthGridBounds(anchorDate);

  try {
    const rows = await db
      .select({
        id:                  appointments.id,
        customerId:          appointments.customerId,
        customerFullName:    customers.fullName,
        serviceId:           appointments.serviceId,
        serviceNameI18n:     catalogServices.nameI18n,
        serviceColor:        catalogServices.color,
        durationMinutes:     catalogServices.durationMinutes,
        bufferBeforeMinutes: catalogServices.bufferBeforeMinutes,
        bufferAfterMinutes:  catalogServices.bufferAfterMinutes,
        startAt:             appointments.startAt,
        endAt:               appointments.endAt,
        status:              appointments.status,
        totalCents:          appointments.totalCents,
      })
      .from(appointments)
      .innerJoin(customers,       eq(appointments.customerId, customers.id))
      .innerJoin(catalogServices, eq(appointments.serviceId,  catalogServices.id))
      .where(and(
        eq(appointments.organizationId, organizationId),
        between(appointments.startAt, gridStart, gridEnd),
      ))
      .orderBy(asc(appointments.startAt));

    const events: CalendarEvent[] = rows.map((r) => ({
      id:                  r.id,
      customerId:          r.customerId,
      customerName:        r.customerFullName ?? '—',
      serviceId:           r.serviceId,
      serviceName:         (r.serviceNameI18n as Record<string, string>) ?? {},
      serviceColor:        r.serviceColor,
      durationMinutes:     r.durationMinutes,
      bufferBeforeMinutes: r.bufferBeforeMinutes,
      bufferAfterMinutes:  r.bufferAfterMinutes,
      startAt:             r.startAt,
      endAt:               r.endAt,
      status:              r.status,
      totalCents:          r.totalCents,
    }));

    return { data: { events, gridStart, gridEnd, monthStart }, error: null };
  } catch {
    return dbErr('Failed to fetch calendar month');
  }
}

// ── Blocked intervals ─────────────────────────────────────────

export type CreateBlockedIntervalInput = {
  organizationId: string;
  profileId:      string;
  startAt:        Date;
  endAt:          Date;
  reason:         BlockReason;
  title?:         string | null;
};

export async function createBlockedInterval(
  input: CreateBlockedIntervalInput,
): Promise<Result<{ id: string }>> {
  if (input.endAt <= input.startAt) {
    return { data: null, error: { message: 'A data final deve ser depois da inicial', code: 'VALIDATION' } };
  }
  try {
    const rows = await db
      .insert(blockedIntervals)
      .values({
        organizationId:   input.organizationId,
        profileId:        input.profileId,
        startAt:          input.startAt,
        endAt:            input.endAt,
        reason:           input.reason,
        title:            input.title ?? null,
        recurrenceType:   'none',
        recurrenceConfig: {},
        isActive:         true,
      })
      .returning({ id: blockedIntervals.id });

    if (!rows[0]) return dbErr('Insert returned empty');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to create blocked interval');
  }
}
