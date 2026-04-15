import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  timestamp,
  jsonb,
} from 'drizzle-orm/pg-core';
import { integrationProviderEnum, integrationStatusEnum } from './enums';
import { organizations } from './organizations';

// ── organization_phones ───────────────────────────────────────
// Multiple phone numbers per organization
export const organizationPhones = pgTable('organization_phones', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  phone:          text('phone').notNull(),
  label:          text('label'),
  isPrimary:      boolean('is_primary').notNull().default(false),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── organization_gallery ──────────────────────────────────────
// Brand appearance image gallery. Files stored in Supabase Storage.
export const organizationGallery = pgTable('organization_gallery', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  storagePath:    text('storage_path').notNull(),
  altText:        text('alt_text'),
  sortOrder:      smallint('sort_order').notNull().default(0),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── org_integrations ──────────────────────────────────────────
// Generic table for all external integrations per org.
// One row per (organization, provider).
// Calendar sync → calendar_integrations. Stripe base → organizations.
//
// config JSONB guide per provider:
//   instagram          → { page_id, instagram_user_id }
//   facebook           → { page_id, pixel_id }
//   stripe             → {} (data in organizations table)
//   google_reviews     → { place_id, account_id, location_id }
//   mailchimp          → { server_prefix, list_id }
//   google_analytics   → { measurement_id: "G-XXXX" }
//   google_tag_manager → { container_id: "GTM-XXXX" }
//   zapier             → { webhook_url }
//   reserve_with_google→ { place_id, merchant_id }
export const orgIntegrations = pgTable('org_integrations', {
  id:              uuid('id').primaryKey().defaultRandom(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  provider:        integrationProviderEnum('provider').notNull(),
  status:          integrationStatusEnum('status').notNull().default('disconnected'),
  /** Provider-specific public config values */
  config:          jsonb('config').notNull().default({}),
  /** ENCRYPTED at application layer */
  accessToken:     text('access_token'),
  /** ENCRYPTED at application layer */
  refreshToken:    text('refresh_token'),
  tokenExpiresAt:  timestamp('token_expires_at', { withTimezone: true }),
  connectedAt:     timestamp('connected_at', { withTimezone: true }),
  lastSyncedAt:    timestamp('last_synced_at', { withTimezone: true }),
  lastError:       text('last_error'),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type OrganizationPhone = typeof organizationPhones.$inferSelect;
export type OrgIntegration = typeof orgIntegrations.$inferSelect;
export type NewOrgIntegration = typeof orgIntegrations.$inferInsert;
