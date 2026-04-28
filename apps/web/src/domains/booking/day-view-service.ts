import 'server-only';

import { eq, and, gte, lte, between, inArray } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { appointments } from './schema';
import { availabilityRules, blockedIntervals } from '@/infrastructure/db/schema/calendar';
import { customers } from '@/infrastructure/db/schema/customers';
import { catalogServices } from '@/domains/catalog/schema';
import type { Result } from '@/shared/types/result';

// ── Types ─────────────────────────────────────────────────────

export type DayAppointment = {
  id:           string;
  startAt:      Date;
  endAt:        Date;
  status:       string;
  customerName: string;
  serviceName:  Record<string, string>;
};

export type DayBlockedInterval = {
  id:      string;
  startAt: Date;
  endAt:   Date;
  reason:  string;
};

export type DayViewData = {
  businessStart:    string; // "HH:MM:SS"
  businessEnd:      string;
  isOpen:           boolean;
  appointments:     DayAppointment[];
  blockedIntervals: DayBlockedInterval[];
};

// ── Service ───────────────────────────────────────────────────

// Show active + completed appointments on the day grid
const SHOW_STATUSES = ['pending', 'confirmed', 'completed'] as const;

/**
 * getDayView — full day snapshot for the management calendar.
 *
 * Parallel fetch:
 *   1. availability_rules  → business hours for the day-of-week
 *   2. appointments        → all active appts + customer name + service name
 *   3. blocked_intervals   → all blocks overlapping the day
 *
 * Tenant isolation: all queries filter by organizationId.
 * No SELECT * — explicit column lists throughout.
 */
export async function getDayView(
  orgId: string,
  date:  Date,
): Promise<Result<DayViewData>> {
  const dow      = date.getUTCDay();
  const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

  try {
    const [ruleRows, apptRows, blockRows] = await Promise.all([

      db.select({
        openTime:  availabilityRules.openTime,
        closeTime: availabilityRules.closeTime,
      }).from(availabilityRules)
        .where(and(
          eq(availabilityRules.organizationId, orgId),
          eq(availabilityRules.dayOfWeek, dow),
          eq(availabilityRules.isActive, true),
        )).limit(1),

      db.select({
        id:           appointments.id,
        startAt:      appointments.startAt,
        endAt:        appointments.endAt,
        status:       appointments.status,
        customerName: customers.fullName,
        serviceName:  catalogServices.nameI18n,
      }).from(appointments)
        .innerJoin(customers,       eq(appointments.customerId, customers.id))
        .innerJoin(catalogServices, eq(appointments.serviceId, catalogServices.id))
        .where(and(
          eq(appointments.organizationId, orgId),
          between(appointments.startAt, dayStart, dayEnd),
          inArray(appointments.status, [...SHOW_STATUSES]),
        )),

      db.select({
        id:      blockedIntervals.id,
        startAt: blockedIntervals.startAt,
        endAt:   blockedIntervals.endAt,
        reason:  blockedIntervals.reason,
      }).from(blockedIntervals)
        .where(and(
          eq(blockedIntervals.organizationId, orgId),
          eq(blockedIntervals.isActive, true),
          lte(blockedIntervals.startAt, dayEnd),
          gte(blockedIntervals.endAt, dayStart),
        )),

    ]);

    const rule = ruleRows[0];
    if (!rule) {
      return {
        data:  { businessStart: '08:00', businessEnd: '20:00', isOpen: false, appointments: [], blockedIntervals: [] },
        error: null,
      };
    }

    return {
      data: {
        businessStart:    rule.openTime,
        businessEnd:      rule.closeTime,
        isOpen:           true,
        appointments:     apptRows.map(a => ({
          id:           a.id,
          startAt:      a.startAt,
          endAt:        a.endAt,
          status:       a.status,
          customerName: a.customerName,
          serviceName:  (a.serviceName as Record<string, string>) ?? {},
        })),
        blockedIntervals: blockRows.map(b => ({
          id:      b.id,
          startAt: b.startAt,
          endAt:   b.endAt,
          reason:  b.reason,
        })),
      },
      error: null,
    };
  } catch {
    return { data: null, error: { message: 'Failed to load day view', code: 'DB_ERROR' } };
  }
}
