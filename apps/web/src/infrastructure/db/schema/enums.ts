import { pgEnum } from 'drizzle-orm/pg-core';

// ── Auth & Roles ─────────────────────────────────────────────
export const userRoleEnum = pgEnum('user_role', [
  'super_admin',
  'owner',
  'staff',
]);

// ── Booking ──────────────────────────────────────────────────
export const appointmentStatusEnum = pgEnum('appointment_status', [
  'pending',
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
]);

export const discountTypeEnum = pgEnum('discount_type', ['percent', 'fixed']);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'succeeded',
  'failed',
  'refunded',
]);

// ── Onboarding & Invitations ─────────────────────────────────
export const invitationStatusEnum = pgEnum('invitation_status', [
  'pending',
  'accepted',
  'expired',
  'cancelled',
]);

// ── Calendar ─────────────────────────────────────────────────
export const calendarProviderEnum = pgEnum('calendar_provider', [
  'google',
  'microsoft',
  'apple',
]);

export const blockReasonEnum = pgEnum('block_reason', [
  'vacation',
  'illness',
  'training',
  'other',
]);

export const recurrenceTypeEnum = pgEnum('recurrence_type', [
  'none',
  'daily',
  'weekdays',
  'weekly',
  'monthly',
  'yearly',
  'custom',
]);

// ── Clinical ─────────────────────────────────────────────────
export const invasivenessLevelEnum = pgEnum('invasiveness_level', [
  'low',
  'medium',
  'high',
  'invasive',
]);

export const documentTypeEnum = pgEnum('document_type', [
  'informed_consent',
  'clinical_evaluation',
]);

export const skinTypeEnum = pgEnum('skin_type', [
  'dry',
  'oily',
  'mixed',
  'normal',
  'sensitive',
]);

export const hydrationLevelEnum = pgEnum('hydration_level', [
  'low',
  'medium',
  'high',
]);

export const skinTextureEnum = pgEnum('skin_texture', [
  'fine',
  'medium',
  'thick',
]);

export const severityLevelEnum = pgEnum('severity_level', [
  'mild',
  'moderate',
  'severe',
]);

export const cycleStatusEnum = pgEnum('cycle_status', [
  'active',
  'completed',
  'paused',
]);

export const sessionPhotoTypeEnum = pgEnum('session_photo_type', [
  'before',
  'after',
  'progress',
]);

export const adherenceStatusEnum = pgEnum('adherence_status', [
  'followed',
  'partial',
  'not_followed',
  'not_reported',
]);

export const prescriptionPeriodEnum = pgEnum('prescription_period', [
  'morning',
  'night',
  'both',
]);

// ── Settings ─────────────────────────────────────────────────
export const customFieldTypeEnum = pgEnum('custom_field_type', [
  'text',
  'textarea',
  'select',
  'checkbox',
  'date',
  'phone',
]);

// ── Integrations ─────────────────────────────────────────────
export const integrationProviderEnum = pgEnum('integration_provider', [
  'instagram',
  'facebook',
  'stripe',
  'google_reviews',
  'mailchimp',
  'google_analytics',
  'google_tag_manager',
  'zapier',
  'reserve_with_google',
]);

export const integrationStatusEnum = pgEnum('integration_status', [
  'connected',
  'disconnected',
  'error',
  'pending',
]);

// ── Notifications ────────────────────────────────────────────
export const notificationTargetEnum = pgEnum('notification_target', [
  'team',
  'client',
]);

export const notificationChannelEnum = pgEnum('notification_channel', [
  'email',
  'sms',
  'whatsapp',
]);

export const reminderUnitEnum = pgEnum('reminder_unit', [
  'minutes',
  'hours',
  'days',
  'weeks',
  'months',
]);
