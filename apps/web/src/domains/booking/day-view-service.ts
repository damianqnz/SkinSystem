import 'server-only';

import { eq, and, gte, lte, between, inArray, or, isNull, asc, lt } from 'drizzle-orm';
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

// Slot availability excludes only active (pending/confirmed) appointments —
// a completed appointment never blocks a slot.
const ACTIVE_STATUSES = ['pending', 'confirmed'] as const;

/**
 * Shared staff-aware availability-rule query — the single place where the
 * member-vs-org precedence rule lives. Used by both `getDayView` and
 * `getAvailableHourSlots`.
 *
 * - tenant isolation: always filtered by organizationId
 * - only active rules
 * - when `staffProfileId` is given, a member-specific rule (profile_id = id)
 *   wins over the org-level rule (profile_id IS NULL); Postgres sorts NULLs
 *   last on ASC, so `.orderBy(asc(profileId)).limit(1)` returns the member
 *   rule first when one exists.
 */
function availabilityRuleQuery(orgId: string, dow: number, staffProfileId?: string) {
  return db
    .select({
      openTime:  availabilityRules.openTime,
      closeTime: availabilityRules.closeTime,
    }).from(availabilityRules)
    .where(and(
      eq(availabilityRules.organizationId, orgId),
      eq(availabilityRules.dayOfWeek, dow),
      eq(availabilityRules.isActive, true),
      ...(staffProfileId
        ? [or(isNull(availabilityRules.profileId), eq(availabilityRules.profileId, staffProfileId))]
        : []),
    ))
    .orderBy(...(staffProfileId ? [asc(availabilityRules.profileId)] : []))
    .limit(1);
}

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
  date: Date,
  staffProfileId?: string,
): Promise<Result<DayViewData>> {
  const dow      = date.getUTCDay();
  const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

  try {
    // Availability: a staff-specific rule (profile_id = staffProfileId) takes
    // precedence over the org-level rule (profile_id IS NULL); both still apply.
    const ruleQuery = availabilityRuleQuery(orgId, dow, staffProfileId);

    const [ruleRows, apptRows, blockRows] = await Promise.all([

      ruleQuery,

      db.select({
        id:           appointments.id,
        startAt:      appointments.startAt,
        endAt:        appointments.endAt,
        status:       appointments.status,
        customerName: customers.fullName,
        serviceName:  catalogServices.nameI18n,
      }).from(appointments)
        .innerJoin(customers, and(eq(appointments.customerId, customers.id), eq(customers.organizationId, appointments.organizationId)))
        .innerJoin(catalogServices, and(eq(appointments.serviceId, catalogServices.id), eq(catalogServices.organizationId, appointments.organizationId)))
        .where(and(
          eq(appointments.organizationId, orgId),
          between(appointments.startAt, dayStart, dayEnd),
          inArray(appointments.status, [...SHOW_STATUSES]),
          ...(staffProfileId ? [eq(appointments.staffProfileId, staffProfileId)] : []),
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
          // blocked_intervals.profile_id is NOT NULL: every block belongs to one
          // professional, so there are no org-wide rows to keep (unlike the
          // availability rules above, where NULL means org-level).
          ...(staffProfileId ? [eq(blockedIntervals.profileId, staffProfileId)] : []),
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

/**
 * getAvailableHourSlots — the slot picker behind the "new appointment" form.
 *
 * Returns "HH:00" strings for every free hour between the resolved rule's open
 * and close times, excluding hours already booked by active (pending/confirmed)
 * appointments. Mirrors `getDayView`'s staff-aware rule resolution: a
 * member-specific rule wins over the org-level one, and when `staffProfileId`
 * is given only that member's appointments block slots.
 *
 * No active rule → empty list (not an error).
 */
export async function getAvailableHourSlots(
  orgId: string,
  date: Date,
  staffProfileId?: string,
): Promise<Result<string[]>> {
  const dow      = date.getUTCDay();
  const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

  try {
    const [ruleRows, bookedRows] = await Promise.all([
      availabilityRuleQuery(orgId, dow, staffProfileId),

      db.select({ startAt: appointments.startAt })
        .from(appointments)
        .where(and(
          eq(appointments.organizationId, orgId),
          gte(appointments.startAt, dayStart),
          lt(appointments.startAt, dayEnd),
          inArray(appointments.status, [...ACTIVE_STATUSES]),
          ...(staffProfileId ? [eq(appointments.staffProfileId, staffProfileId)] : []),
        )),
    ]);

    const rule = ruleRows[0];
    if (!rule) return { data: [], error: null };

    const bookedHours = new Set(bookedRows.map((a) => a.startAt.getUTCHours()));

    const openH  = parseInt(rule.openTime.slice(0, 2), 10);
    const closeH = parseInt(rule.closeTime.slice(0, 2), 10);
    const slots: string[] = [];
    for (let h = openH; h < closeH; h++) {
      if (!bookedHours.has(h)) slots.push(`${String(h).padStart(2, '0')}:00`);
    }

    return { data: slots, error: null };
  } catch {
    return { data: null, error: { message: 'Failed to load available slots', code: 'DB_ERROR' } };
  }
}
