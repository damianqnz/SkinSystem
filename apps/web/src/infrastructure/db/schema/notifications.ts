import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  timestamp,
} from 'drizzle-orm/pg-core';
import {
  notificationTargetEnum,
  notificationChannelEnum,
  reminderUnitEnum,
} from './enums';
import { organizations } from './organizations';

// ── notification_settings ─────────────────────────────────────
// 1:1 per organization. Controls which events trigger notifications.
export const notificationSettings = pgTable('notification_settings', {
  id:                       uuid('id').primaryKey().defaultRandom(),
  organizationId:           uuid('organization_id').notNull().unique().references(() => organizations.id, { onDelete: 'cascade' }),
  // Team notifications
  teamNotifyConfirmation:   boolean('team_notify_confirmation').notNull().default(true),
  teamNotifyAlteration:     boolean('team_notify_alteration').notNull().default(true),
  teamNotifyCancellation:   boolean('team_notify_cancellation').notNull().default(true),
  // Client notifications
  clientNotifyConfirmation: boolean('client_notify_confirmation').notNull().default(true),
  clientNotifyAlteration:   boolean('client_notify_alteration').notNull().default(true),
  clientNotifyCancellation: boolean('client_notify_cancellation').notNull().default(true),
  // Sender customization
  senderName:               text('sender_name'),
  emailSignature:           text('email_signature'),
  // Review request (Phase 6c)
  reviewRequestEnabled:     boolean('review_request_enabled').notNull().default(true),
  reviewRequestDelayValue:  smallint('review_request_delay_value').notNull().default(4),
  reviewRequestDelayUnit:   reminderUnitEnum('review_request_delay_unit').notNull().default('hours'),
  createdAt:                timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── notification_reminders ────────────────────────────────────
// Multiple reminder rules per org (e.g. email 1 day before + WhatsApp 2 hours before)
export const notificationReminders = pgTable('notification_reminders', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  target:         notificationTargetEnum('target').notNull(),
  channel:        notificationChannelEnum('channel').notNull(),
  timingValue:    smallint('timing_value').notNull(),
  timingUnit:     reminderUnitEnum('timing_unit').notNull(),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── google_reviews ────────────────────────────────────────────
// Local cache of Google Maps reviews.
// Synced daily via Google Business Profile API.
// owner responds from dashboard → reply published to Google Maps.
export const googleReviews = pgTable('google_reviews', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  /** Stable external ID from Google — never changes */
  googleReviewId:   text('google_review_id').notNull(),
  reviewerName:     text('reviewer_name'),
  reviewerPhotoUrl: text('reviewer_photo_url'),
  rating:           smallint('rating').notNull(),
  comment:          text('comment'),
  publishedAt:      timestamp('published_at', { withTimezone: true }).notNull(),
  /** Response text synced from Google and/or written in dashboard */
  replyText:        text('reply_text'),
  repliedAt:        timestamp('replied_at', { withTimezone: true }),
  /** Pin featured reviews in the dashboard */
  isHighlighted:    boolean('is_highlighted').notNull().default(false),
  lastSyncedAt:     timestamp('last_synced_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type NotificationSettings = typeof notificationSettings.$inferSelect;
export type NotificationReminder = typeof notificationReminders.$inferSelect;
export type NewNotificationReminder = typeof notificationReminders.$inferInsert;
export type GoogleReview = typeof googleReviews.$inferSelect;
