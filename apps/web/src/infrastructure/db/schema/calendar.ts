import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  time,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import {
  calendarProviderEnum,
  sessionPhotoTypeEnum,
  invitationStatusEnum,
  blockReasonEnum,
  recurrenceTypeEnum,
  userRoleEnum,
} from './enums';
import { organizations } from './organizations';
import { profiles } from './organizations';

// ── organization_invitations ──────────────────────────────────
// Dual flow:
//   a) New org onboarding → organization_id IS NULL, role = 'owner'
//   b) Staff invitation   → organization_id IS SET, role = 'staff'
export const organizationInvitations = pgTable('organization_invitations', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').references(() => organizations.id, { onDelete: 'cascade' }),
  invitedBy:      uuid('invited_by').references(() => profiles.id, { onDelete: 'set null' }),
  email:          text('email').notNull(),
  role:           userRoleEnum('role').notNull().default('staff'),
  token:          text('token').notNull().unique(),
  status:         invitationStatusEnum('status').notNull().default('pending'),
  /** For new org: { org_name: "...", org_slug: "..." } */
  metadata:       jsonb('metadata').notNull().default({}),
  expiresAt:      timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt:     timestamp('accepted_at', { withTimezone: true }),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── calendar_integrations ─────────────────────────────────────
// One connection per (profile, provider). OAuth tokens encrypted at app layer.
export const calendarIntegrations = pgTable('calendar_integrations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  profileId:       uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  provider:        calendarProviderEnum('provider').notNull(),
  /** ENCRYPTED at application layer */
  accessToken:     text('access_token').notNull(),
  /** ENCRYPTED at application layer */
  refreshToken:    text('refresh_token'),
  tokenExpiresAt:  timestamp('token_expires_at', { withTimezone: true }),
  calendarId:      text('calendar_id').notNull(),
  calendarName:    text('calendar_name'),
  syncEnabled:     boolean('sync_enabled').notNull().default(true),
  lastSyncedAt:    timestamp('last_synced_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── external_calendar_events ──────────────────────────────────
// Events pulled from Google/Microsoft/Apple.
// Visible in the panel with title. is_blocking hides slot in public booking page.
export const externalCalendarEvents = pgTable('external_calendar_events', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  integrationId:    uuid('integration_id').notNull().references(() => calendarIntegrations.id, { onDelete: 'cascade' }),
  profileId:        uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  externalEventId:  text('external_event_id').notNull(),
  title:            text('title'),
  startAt:          timestamp('start_at', { withTimezone: true }).notNull(),
  endAt:            timestamp('end_at', { withTimezone: true }).notNull(),
  isBlocking:       boolean('is_blocking').notNull().default(true),
  lastSyncedAt:     timestamp('last_synced_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── availability_rules ────────────────────────────────────────
// profile_id IS NULL  → org-level rule (general configuration)
// profile_id IS SET   → staff-specific rule
// day_of_week: 0 = Sunday … 6 = Saturday
export const availabilityRules = pgTable('availability_rules', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  profileId:      uuid('profile_id').references(() => profiles.id, { onDelete: 'cascade' }),
  dayOfWeek:      smallint('day_of_week').notNull(),
  isActive:       boolean('is_active').notNull().default(true),
  openTime:       time('open_time').notNull(),
  closeTime:      time('close_time').notNull(),
  breakStart:     time('break_start'),
  breakEnd:       time('break_end'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── blocked_intervals ─────────────────────────────────────────
// Manual date blocking by professional (vacation, illness, etc.)
// Also visible in the org calendar. Checked during availability calculation.
export const blockedIntervals = pgTable('blocked_intervals', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  profileId:        uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  reason:           blockReasonEnum('reason').notNull().default('other'),
  title:            text('title'),
  startAt:          timestamp('start_at', { withTimezone: true }).notNull(),
  endAt:            timestamp('end_at', { withTimezone: true }).notNull(),
  recurrenceType:   recurrenceTypeEnum('recurrence_type').notNull().default('none'),
  /**
   * For 'custom' recurrence:
   * { days_of_week: [0-6], interval: number,
   *   end_type: 'date'|'occurrences'|'never',
   *   end_date?: string, end_after?: number }
   */
  recurrenceConfig: jsonb('recurrence_config').notNull().default({}),
  isActive:         boolean('is_active').notNull().default(true),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type AvailabilityRule = typeof availabilityRules.$inferSelect;
export type BlockedInterval = typeof blockedIntervals.$inferSelect;
export type NewBlockedInterval = typeof blockedIntervals.$inferInsert;
export type OrganizationInvitation = typeof organizationInvitations.$inferSelect;
