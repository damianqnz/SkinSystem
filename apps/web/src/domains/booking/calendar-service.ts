import 'server-only';

import { eq, and, between, asc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { appointments } from './schema';
import { catalogServices } from '@/domains/catalog/schema';
import { customers } from '@/infrastructure/db/schema/customers';
import type { Result } from '@/shared/types/result';

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
