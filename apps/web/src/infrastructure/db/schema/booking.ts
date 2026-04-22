import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  smallint,
  numeric,
  date,
  timestamp,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import {
  discountTypeEnum,
  appointmentStatusEnum,
  paymentStatusEnum,
  customFieldTypeEnum,
} from './enums';
import { organizations } from './organizations';
import { profiles } from './organizations';
import { customers } from './customers';
import { catalogServices } from './catalog';

// ── coupons ───────────────────────────────────────────────────
export const coupons = pgTable('coupons', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  code:           text('code').notNull(),
  discountType:   discountTypeEnum('discount_type').notNull(),
  discountValue:  numeric('discount_value', { precision: 10, scale: 2 }).notNull(),
  maxUses:        integer('max_uses'),
  usesCount:      integer('uses_count').notNull().default(0),
  validFrom:      date('valid_from').notNull(),
  validUntil:     date('valid_until'),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_coupon_code_per_org').on(t.organizationId, t.code),
]);

// ── payment_surcharges ────────────────────────────────────────
// Org-level taxes or reductions applied to all bookings
export const paymentSurcharges = pgTable('payment_surcharges', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  name:           text('name').notNull(),
  /** 'percent' → value = 21.00 means 21% | 'fixed' → value = 1000 means €10.00 in cents */
  valueType:      discountTypeEnum('value_type').notNull(),
  value:          numeric('value', { precision: 10, scale: 2 }).notNull(),
  /** true = reduction (subtracts) | false = surcharge/tax (adds) */
  isReduction:    boolean('is_reduction').notNull().default(false),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── booking_settings ──────────────────────────────────────────
// 1:1 per organization
export const bookingSettings = pgTable('booking_settings', {
  id:                         uuid('id').primaryKey().defaultRandom(),
  organizationId:             uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  allowSameDayBooking:        boolean('allow_same_day_booking').notNull().default(false),
  bookingWindowDays:          integer('booking_window_days').notNull().default(60),
  thankYouUrl:                text('thank_you_url'),
  redirectAfterPayment:       boolean('redirect_after_payment').notNull().default(true),
  cancellationPolicyText:     text('cancellation_policy_text'),
  cancellationHoursNotice:    integer('cancellation_hours_notice').notNull().default(24),
  // Phase 4 — payment toggles
  onlinePaymentEnabled:       boolean('online_payment_enabled').notNull().default(false),
  advancePaymentRequired:     boolean('advance_payment_required').notNull().default(false),
  // Phase 5 — booking preference toggles
  firstAvailableSlot:         boolean('first_available_slot').notNull().default(false),
  skipTeamMember:             boolean('skip_team_member').notNull().default(false),
  allowMultipleServices:      boolean('allow_multiple_services').notNull().default(false),
  anyTeamMemberAllowed:       boolean('any_team_member_allowed').notNull().default(true),
  clientLoginEnabled:         boolean('client_login_enabled').notNull().default(false),
  allowOnlineRescheduling:    boolean('allow_online_rescheduling').notNull().default(false),
  allowOnlineCancellation:    boolean('allow_online_cancellation').notNull().default(true),
  showRebookButton:           boolean('show_rebook_button').notNull().default(true),
  // Phase 5 — contact form field toggles
  formFieldName:              boolean('form_field_name').notNull().default(true),
  formFieldPhone:             boolean('form_field_phone').notNull().default(true),
  formFieldEmail:             boolean('form_field_email').notNull().default(true),
  formFieldAddress:           boolean('form_field_address').notNull().default(false),
  // Phase 11 — extended preferences for /settings/preferences
  slotDurationMinutes:        integer('slot_duration_minutes').notNull().default(30),
  bookingLeadTimeHours:       integer('booking_lead_time_hours').notNull().default(4),
  clientLoginRequired:        boolean('client_login_required').notNull().default(false),
  accordionView:              boolean('accordion_view').notNull().default(true),
  showServicePrices:          boolean('show_service_prices').notNull().default(true),
  showServiceDuration:        boolean('show_service_duration').notNull().default(true),
  showWorkingHours:           boolean('show_working_hours').notNull().default(true),
  showLocalTime:              boolean('show_local_time').notNull().default(false),
  termsLabel:                 text('terms_label'),
  termsUrl:                   text('terms_url'),
  termsRequired:              boolean('terms_required').notNull().default(false),
  redirectLabel:              text('redirect_label'),
  redirectUrl:                text('redirect_url'),
  showInSearchResults:        boolean('show_in_search_results').notNull().default(true),
  preferredLanguage:          text('preferred_language').notNull().default('pt'),
  timeFormat:                 text('time_format').notNull().default('24h'),
  weekStartDay:               integer('week_start_day').notNull().default(1),
  createdAt:                  timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                  timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── appointments ──────────────────────────────────────────────
// total_cents = price_cents - discount_cents + surcharges_cents
export const appointments = pgTable('appointments', {
  id:                  uuid('id').primaryKey().defaultRandom(),
  organizationId:      uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:          uuid('customer_id').notNull().references(() => customers.id),
  serviceId:           uuid('service_id').notNull().references(() => catalogServices.id),
  staffProfileId:      uuid('staff_profile_id').notNull().references(() => profiles.id),
  startAt:             timestamp('start_at', { withTimezone: true }).notNull(),
  endAt:               timestamp('end_at', { withTimezone: true }).notNull(),
  status:              appointmentStatusEnum('status').notNull().default('pending'),
  stripePaymentId:     text('stripe_payment_id'),
  couponId:            uuid('coupon_id').references(() => coupons.id),
  priceCents:          integer('price_cents').notNull(),
  discountCents:       integer('discount_cents').notNull().default(0),
  surchargesCents:     integer('surcharges_cents').notNull().default(0),
  totalCents:          integer('total_cents').notNull(),
  guestComment:        text('guest_comment'),
  policyAcceptedAt:    timestamp('policy_accepted_at', { withTimezone: true }),
  reviewRequestSentAt: timestamp('review_request_sent_at', { withTimezone: true }),
  createdAt:           timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:           timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_appointments_org_id').on(t.organizationId),
  index('idx_appointments_customer_id').on(t.customerId),
  index('idx_appointments_start_at').on(t.startAt),
]);

// ── temporary_slots ───────────────────────────────────────────
// 5-minute lock to prevent double booking during checkout (anti race-condition)
export const temporarySlots = pgTable('temporary_slots', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  serviceId:        uuid('service_id').notNull().references(() => catalogServices.id),
  slotStart:        timestamp('slot_start', { withTimezone: true }).notNull(),
  slotEnd:          timestamp('slot_end', { withTimezone: true }).notNull(),
  lockedBySession:  text('locked_by_session').notNull(),
  expiresAt:        timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── coupon_redemptions ────────────────────────────────────────
export const couponRedemptions = pgTable('coupon_redemptions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  couponId:       uuid('coupon_id').notNull().references(() => coupons.id),
  appointmentId:  uuid('appointment_id').notNull().references(() => appointments.id),
  customerId:     uuid('customer_id').notNull().references(() => customers.id),
  redeemedAt:     timestamp('redeemed_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_coupon_per_appointment').on(t.couponId, t.appointmentId),
]);

// ── payments ──────────────────────────────────────────────────
// owner-only RLS (financial data)
export const payments = pgTable('payments', {
  id:                     uuid('id').primaryKey().defaultRandom(),
  organizationId:         uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  appointmentId:          uuid('appointment_id').notNull().references(() => appointments.id),
  stripePaymentIntentId:  text('stripe_payment_intent_id').notNull(),
  amountCents:            integer('amount_cents').notNull(),
  currency:               text('currency').notNull().default('eur'),
  status:                 paymentStatusEnum('status').notNull().default('pending'),
  paidAt:                 timestamp('paid_at', { withTimezone: true }),
  createdAt:              timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:              timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_payments_org_id').on(t.organizationId),
]);

// ── booking_custom_fields ─────────────────────────────────────
export const bookingCustomFields = pgTable('booking_custom_fields', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  label:          text('label').notNull(),
  fieldType:      customFieldTypeEnum('field_type').notNull().default('text'),
  isRequired:     boolean('is_required').notNull().default(false),
  isActive:       boolean('is_active').notNull().default(true),
  sortOrder:      smallint('sort_order').notNull().default(0),
  /** For 'select' type: ["option1", "option2"] */
  options:        text('options').array().default([]),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Coupon = typeof coupons.$inferSelect;
export type NewCoupon = typeof coupons.$inferInsert;
export type Appointment = typeof appointments.$inferSelect;
export type NewAppointment = typeof appointments.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type PaymentSurcharge = typeof paymentSurcharges.$inferSelect;
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type TemporarySlot = typeof temporarySlots.$inferSelect;
