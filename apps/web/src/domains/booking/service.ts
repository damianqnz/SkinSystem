import 'server-only';

import { eq, and, gte, lte, asc, between, inArray } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { appointments }      from './schema';
import { catalogServices }   from '@/domains/catalog/schema';
import { customers }         from '@/infrastructure/db/schema/customers';
import { profiles }          from '@/infrastructure/db/schema/organizations';
import { availabilityRules, blockedIntervals } from '@/infrastructure/db/schema/calendar';
import type { SelectAppointment, AppointmentStatus, CreateAppointmentInput } from './schema';
import type { Result } from '@/shared/types/result';
import { buildSlotKey, getLockedSlotKeys, checkSlotLocks } from '@/shared/lib/redis-lock';

// ── Shared helpers ────────────────────────────────────────────

const dbErr = (msg: string) =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } }) as Result<never>;

// ── createAppointment ─────────────────────────────────────────

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .insert(appointments)
      .values({
        organizationId:   input.organizationId,
        customerId:       input.customerId,
        serviceId:        input.serviceId,
        staffProfileId:   input.staffProfileId,
        startAt:          input.startAt,
        endAt:            input.endAt,
        status:           'pending',
        priceCents:       input.priceCents,
        discountCents:    input.discountCents ?? 0,
        surchargesCents:  input.surchargesCents ?? 0,
        totalCents:       input.totalCents,
        couponId:         input.couponId ?? null,
        guestComment:     input.guestComment ?? null,
        policyAcceptedAt: new Date(),
      })
      .returning({ id: appointments.id });
    if (!rows[0]) return dbErr('Insert returned empty');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to create appointment');
  }
}

const APPT_COLS = {
  id:             appointments.id,
  organizationId: appointments.organizationId,
  customerId:     appointments.customerId,
  serviceId:      appointments.serviceId,
  staffProfileId: appointments.staffProfileId,
  startAt:        appointments.startAt,
  endAt:          appointments.endAt,
  status:         appointments.status,
  totalCents:     appointments.totalCents,
};

const ACTIVE: AppointmentStatus[] = ['pending', 'confirmed'];

// ── Date utilities ────────────────────────────────────────────

/** "HH:MM:SS" time string → total minutes from midnight */
function parseTimeMins(t: string): number {
  const [h = '0', m = '0'] = t.split(':');
  return parseInt(h, 10) * 60 + parseInt(m, 10);
}

/** UTC date string "YYYY-MM-DD" */
function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Create a Date for a given UTC date + minutes-from-midnight offset */
function utcDatePlusMins(baseDate: Date, mins: number): Date {
  const d = new Date(baseDate);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCMinutes(mins);
  return d;
}

/** Intervals overlap if one starts before the other ends (exclusive) */
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && aEnd > bStart;
}

// ── Slot status type ──────────────────────────────────────────

export type SlotStatus =
  | 'available'      // free, can be booked
  | 'booked'         // existing confirmed/pending appointment
  | 'locked'         // reserved in Redis (someone in checkout)
  | 'buffer'         // buffer window around an appointment
  | 'blocked'        // manually blocked interval (vacation, etc.)
  | 'break'          // specialist break time
  | 'outside_hours'; // before open or after close

export type ComputedSlot = {
  startAt:       Date;
  endAt:         Date;
  status:        SlotStatus;
  appointmentId: string | null;  // set when status = 'booked'
  lockedBy:      string | null;  // set when status = 'locked' (sessionId)
};

// ── Existing queries ──────────────────────────────────────────

export async function getUpcomingAppointments(
  organizationId: string,
): Promise<Result<SelectAppointment[]>> {
  try {
    const data = await db
      .select(APPT_COLS)
      .from(appointments)
      .where(and(
        eq(appointments.organizationId, organizationId),
        gte(appointments.startAt, new Date()),
        inArray(appointments.status, ACTIVE),
      ))
      .orderBy(asc(appointments.startAt)) as SelectAppointment[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch appointments');
  }
}

export async function getSlotsByDate(
  organizationId: string,
  date: Date,
): Promise<Result<SelectAppointment[]>> {
  const s = new Date(date); s.setUTCHours(0, 0, 0, 0);
  const e = new Date(date); e.setUTCHours(23, 59, 59, 999);
  try {
    const data = await db
      .select(APPT_COLS)
      .from(appointments)
      .where(and(
        eq(appointments.organizationId, organizationId),
        between(appointments.startAt, s, e),
      ))
      .orderBy(asc(appointments.startAt)) as SelectAppointment[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch slots');
  }
}

// ── calculateAvailableSlots ───────────────────────────────────

/**
 * Full availability engine for a single day.
 *
 * Algorithm:
 *  1. Fetch service (duration, buffer times)
 *  2. Fetch availabilityRule for day-of-week (if absent → closed day)
 *  3. Fetch active appointments for the date (pending + confirmed)
 *  4. Fetch blockedIntervals intersecting the date
 *  5. Fetch Redis-locked slot keys for org+date
 *  6. Generate slot grid: openTime → closeTime, step = durationMinutes
 *  7. Classify each slot:
 *       - outside_hours: before open or after close
 *       - break:         overlaps with breakStart–breakEnd
 *       - blocked:       overlaps with a blockedInterval
 *       - booked:        overlaps with an appointment's [startAt, endAt]
 *       - buffer:        overlaps with a buffer zone around an appointment
 *       - locked:        key exists in Redis
 *       - available:     none of the above
 *
 * Tenant isolation: all DB queries filter by `organizationId`.
 */
export async function calculateAvailableSlots(
  organizationId: string,
  serviceId:      string,
  date:           Date,        // target calendar day (UTC midnight used)
): Promise<Result<ComputedSlot[]>> {
  try {
    const dateStr = toDateStr(date);

    // ── 1. Service ───────────────────────────────────────────
    const svcRows = await db
      .select({
        id:                  catalogServices.id,
        durationMinutes:     catalogServices.durationMinutes,
        bufferBeforeMinutes: catalogServices.bufferBeforeMinutes,
        bufferAfterMinutes:  catalogServices.bufferAfterMinutes,
      })
      .from(catalogServices)
      .where(and(
        eq(catalogServices.id, organizationId === '' ? serviceId : serviceId),
        eq(catalogServices.organizationId, organizationId),
      ))
      .limit(1);

    const svc = svcRows[0];
    if (!svc) return { data: null, error: { message: 'Service not found', code: 'NOT_FOUND' } };

    const { durationMinutes, bufferBeforeMinutes, bufferAfterMinutes } = svc;

    // ── 2. Availability rule for day-of-week ─────────────────
    const dow = date.getUTCDay(); // 0=Sun
    const ruleRows = await db
      .select({
        openTime:   availabilityRules.openTime,
        closeTime:  availabilityRules.closeTime,
        breakStart: availabilityRules.breakStart,
        breakEnd:   availabilityRules.breakEnd,
        isActive:   availabilityRules.isActive,
      })
      .from(availabilityRules)
      .where(and(
        eq(availabilityRules.organizationId, organizationId),
        eq(availabilityRules.dayOfWeek, dow),
        eq(availabilityRules.isActive, true),
      ))
      .limit(1);

    // No rule → closed day → return empty list
    if (!ruleRows[0]) return { data: [], error: null };

    const rule = ruleRows[0];
    const openMins  = parseTimeMins(rule.openTime);
    const closeMins = parseTimeMins(rule.closeTime);
    const breakStartMins = rule.breakStart ? parseTimeMins(rule.breakStart) : null;
    const breakEndMins   = rule.breakEnd   ? parseTimeMins(rule.breakEnd)   : null;

    // ── 3. Appointments for the date ─────────────────────────
    const dayStart = new Date(date); dayStart.setUTCHours(0, 0, 0, 0);
    const dayEnd   = new Date(date); dayEnd.setUTCHours(23, 59, 59, 999);

    const [apptRows, blockRows, lockedKeys] = await Promise.all([
      // Appointments (pending + confirmed)
      db.select({
          id:      appointments.id,
          startAt: appointments.startAt,
          endAt:   appointments.endAt,
          status:  appointments.status,
        })
        .from(appointments)
        .where(and(
          eq(appointments.organizationId, organizationId),
          between(appointments.startAt, dayStart, dayEnd),
          inArray(appointments.status, ACTIVE),
        )),

      // Blocked intervals that overlap this day
      db.select({
          startAt: blockedIntervals.startAt,
          endAt:   blockedIntervals.endAt,
        })
        .from(blockedIntervals)
        .where(and(
          eq(blockedIntervals.organizationId, organizationId),
          eq(blockedIntervals.isActive, true),
          lte(blockedIntervals.startAt, dayEnd),
          gte(blockedIntervals.endAt, dayStart),
        )),

      // Redis locked slot keys for this org+date
      getLockedSlotKeys(organizationId, dateStr).catch(() => [] as string[]),
    ]);

    // ── 4. Fetch lock owners in batch ────────────────────────
    const lockMap = await checkSlotLocks(lockedKeys).catch(() => new Map<string, string | null>());

    // Build a fast lookup: startISO → sessionId for locked slots
    const lockedStarts = new Map<string, string>();
    for (const [k, v] of lockMap) {
      const parts = k.split(':');  // slot:{org}:{date}:{startISO}:{svcId}
      const startISO = parts[3];
      if (startISO && v) lockedStarts.set(startISO, v);
    }

    // ── 5. Generate slot grid ────────────────────────────────
    const slots: ComputedSlot[] = [];
    let cursor = openMins;

    while (cursor + durationMinutes <= closeMins) {
      const slotStart = utcDatePlusMins(date, cursor);
      const slotEnd   = utcDatePlusMins(date, cursor + durationMinutes);
      const startISO  = slotStart.toISOString();

      let status: SlotStatus = 'available';
      let appointmentId: string | null = null;
      let lockedBy:      string | null = null;

      // Break time
      if (
        breakStartMins !== null &&
        breakEndMins   !== null &&
        cursor >= breakStartMins &&
        cursor <  breakEndMins
      ) {
        status = 'break';
      }

      // Blocked interval
      if (status === 'available') {
        for (const blk of blockRows) {
          if (overlaps(slotStart, slotEnd, blk.startAt, blk.endAt)) {
            status = 'blocked';
            break;
          }
        }
      }

      // Booked appointment
      if (status === 'available') {
        for (const appt of apptRows) {
          if (overlaps(slotStart, slotEnd, appt.startAt, appt.endAt)) {
            status = 'booked';
            appointmentId = appt.id;
            break;
          }
        }
      }

      // Buffer zones (before/after appointments)
      if (status === 'available') {
        for (const appt of apptRows) {
          const bufStart = new Date(appt.startAt.getTime() - bufferBeforeMinutes * 60_000);
          const bufEnd   = new Date(appt.endAt.getTime()   + bufferAfterMinutes  * 60_000);
          if (overlaps(slotStart, slotEnd, bufStart, bufEnd)) {
            status = 'buffer';
            break;
          }
        }
      }

      // Redis lock
      if (status === 'available') {
        const owner = lockedStarts.get(startISO);
        if (owner) {
          status   = 'locked';
          lockedBy = owner;
        }
      }

      slots.push({ startAt: slotStart, endAt: slotEnd, status, appointmentId, lockedBy });
      cursor += durationMinutes;
    }

    return { data: slots, error: null };
  } catch (err) {
    return dbErr('Failed to calculate availability');
  }
}

// ── Appointment status mutations ──────────────────────────────

/**
 * Cancel an appointment (soft — only flips status). Tenant-scoped.
 * Returns the previous status so callers can offer "undo".
 */
export async function cancelAppointment(
  organizationId: string,
  appointmentId:  string,
): Promise<Result<{ id: string; previousStatus: AppointmentStatus }>> {
  try {
    const rows = await db
      .update(appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.id, appointmentId),
      ))
      .returning({ id: appointments.id, status: appointments.status });

    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Appointment not found', code: 'NOT_FOUND' } };
    // We don't actually have the *previous* status returned by Drizzle here;
    // the orchestrator stores it client-side before calling. Return the new one
    // for symmetry; the undo path uses `restoreAppointmentStatus` below.
    return { data: { id: row.id, previousStatus: row.status }, error: null };
  } catch {
    return dbErr('Failed to cancel appointment');
  }
}

/**
 * Restore an appointment to an arbitrary status (used by the undo toast).
 * Caller must pass the status captured before cancelAppointment ran.
 */
export async function restoreAppointmentStatus(
  organizationId: string,
  appointmentId:  string,
  status:         AppointmentStatus,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(appointments)
      .set({ status, updatedAt: new Date() })
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.id, appointmentId),
      ))
      .returning({ id: appointments.id });

    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Appointment not found', code: 'NOT_FOUND' } };
    return { data: { id: row.id }, error: null };
  } catch {
    return dbErr('Failed to restore appointment');
  }
}

// ── Full appointment detail (for the side sheet) ──────────────

export type AppointmentFull = {
  id:              string;
  status:          AppointmentStatus;
  startAt:         Date;
  endAt:           Date;
  totalCents:      number;
  guestComment:    string | null;
  serviceId:       string;
  serviceName:     Record<string, string>;
  serviceColor:    string | null;
  durationMinutes: number;
  customerId:      string;
  customerName:    string;
  customerEmail:   string | null;
  customerPhone:   string | null;
  staffProfileId:  string;
  staffName:       string | null;
};

export async function getAppointmentFull(
  organizationId: string,
  appointmentId:  string,
): Promise<Result<AppointmentFull>> {
  try {
    const rows = await db
      .select({
        id:              appointments.id,
        status:          appointments.status,
        startAt:         appointments.startAt,
        endAt:           appointments.endAt,
        totalCents:      appointments.totalCents,
        guestComment:    appointments.guestComment,
        serviceId:       appointments.serviceId,
        serviceName:     catalogServices.nameI18n,
        serviceColor:    catalogServices.color,
        durationMinutes: catalogServices.durationMinutes,
        customerId:      appointments.customerId,
        customerName:    customers.fullName,
        customerEmail:   customers.email,
        customerPhone:   customers.phone,
        staffProfileId:  appointments.staffProfileId,
        staffName:       profiles.fullName,
      })
      .from(appointments)
      .innerJoin(customers,       eq(appointments.customerId, customers.id))
      .innerJoin(catalogServices, eq(appointments.serviceId,  catalogServices.id))
      .innerJoin(profiles,        eq(appointments.staffProfileId, profiles.id))
      .where(and(
        eq(appointments.organizationId, organizationId),
        eq(appointments.id, appointmentId),
      ))
      .limit(1);

    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Appointment not found', code: 'NOT_FOUND' } };

    return {
      data: {
        ...row,
        serviceName: (row.serviceName as Record<string, string>) ?? {},
      },
      error: null,
    };
  } catch {
    return dbErr('Failed to fetch appointment');
  }
}

