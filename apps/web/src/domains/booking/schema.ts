/**
 * @domain booking
 * @description Public schema surface for the Booking domain.
 *
 * Covers: appointments, temporary slot locks (race-condition protection),
 * booking settings, and coupons.
 *
 * Price equation: total_cents = price_cents - discount_cents + surcharges_cents
 * All monetary values stored in cents to avoid float precision errors.
 *
 * organization_id is MANDATORY in every query — enforced by RLS + app layer.
 */

import { z } from 'zod';
import {
  appointments,
  temporarySlots,
  bookingSettings,
  coupons,
  type Appointment,
  type NewAppointment,
  type TemporarySlot,
  type BookingSettings,
  type Coupon,
} from '@/infrastructure/db/schema/booking';
import { appointmentStatusEnum } from '@/infrastructure/db/schema/enums';

// ── Table references (Drizzle) ────────────────────────────────
export {
  appointments,
  temporarySlots,
  bookingSettings,
  coupons,
  appointmentStatusEnum,
};

// ── Inferred types ────────────────────────────────────────────
export type {
  Appointment,
  NewAppointment,
  TemporarySlot,
  BookingSettings,
  Coupon,
};

// Short domain aliases
export type SelectAppointment = Appointment;
export type InsertAppointment = NewAppointment;

// ── ENUM values (mirrored for type safety) ────────────────────
export const APPOINTMENT_STATUS = [
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUS)[number];

// ── Zod validators ────────────────────────────────────────────

export const createAppointmentSchema = z.object({
  organizationId:   z.string().uuid(),
  customerId:       z.string().uuid(),
  serviceId:        z.string().uuid(),
  staffProfileId:   z.string().uuid(),
  startAt:          z.coerce.date(),
  endAt:            z.coerce.date(),
  priceCents:       z.number().int().nonnegative(),
  discountCents:    z.number().int().nonnegative().optional().default(0),
  surchargesCents:  z.number().int().nonnegative().optional().default(0),
  totalCents:       z.number().int().nonnegative(),
  couponId:         z.string().uuid().nullable().optional(),
  guestComment:     z.string().max(500).nullable().optional(),
}).refine(
  (d) => d.endAt > d.startAt,
  { message: 'endAt must be after startAt', path: ['endAt'] },
);

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(APPOINTMENT_STATUS),
});

export const lockSlotSchema = z.object({
  organizationId:  z.string().uuid(),
  serviceId:       z.string().uuid(),
  slotStart:       z.coerce.date(),
  slotEnd:         z.coerce.date(),
  lockedBySession: z.string().min(1),
});

export type CreateAppointmentInput      = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentStatusInput = z.infer<typeof updateAppointmentStatusSchema>;
export type LockSlotInput               = z.infer<typeof lockSlotSchema>;
