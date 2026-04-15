import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  smallint,
  jsonb,
  timestamp,
  index,
} from 'drizzle-orm/pg-core';
import { invasivenessLevelEnum } from './enums';
import { organizations } from './organizations';
import { profiles } from './organizations';

// ── catalog_categories ────────────────────────────────────────
export const catalogCategories = pgTable('catalog_categories', {
  id:              uuid('id').primaryKey().defaultRandom(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  /** { es: "...", en: "...", pt: "..." } */
  nameI18n:        jsonb('name_i18n').notNull().default({}),
  descriptionI18n: jsonb('description_i18n').notNull().default({}),
  sortOrder:       integer('sort_order').notNull().default(0),
  isActive:        boolean('is_active').notNull().default(true),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_catalog_categories_org_id').on(t.organizationId),
]);

// ── catalog_services ─────────────────────────────────────────
export const catalogServices = pgTable('catalog_services', {
  id:                   uuid('id').primaryKey().defaultRandom(),
  organizationId:       uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  categoryId:           uuid('category_id').references(() => catalogCategories.id, { onDelete: 'set null' }),
  /** { es: "...", en: "...", pt: "..." } */
  nameI18n:             jsonb('name_i18n').notNull().default({}),
  descriptionI18n:      jsonb('description_i18n').notNull().default({}),
  durationMinutes:      integer('duration_minutes').notNull(),
  /** Price in smallest currency unit (cents) */
  priceCents:           integer('price_cents').notNull(),
  currency:             text('currency').notNull().default('EUR'),
  bufferBeforeMinutes:  integer('buffer_before_minutes').notNull().default(0),
  bufferAfterMinutes:   integer('buffer_after_minutes').notNull().default(0),
  isActive:             boolean('is_active').notNull().default(true),
  sortOrder:            integer('sort_order').notNull().default(0),
  // Added Phase 3b
  color:                text('color'),
  slug:                 text('slug'),
  // Added Phase 3 clinical
  invasivenessLevel:    invasivenessLevelEnum('invasiveness_level').notNull().default('low'),
  // Added Phase 2
  coverImageUrl:        text('cover_image_url'),
  depositPercent:       smallint('deposit_percent').notNull().default(100),
  createdAt:            timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:            timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index('idx_catalog_services_org_id').on(t.organizationId),
]);

// ── service_staff ─────────────────────────────────────────────
// Many-to-many: which professionals offer which service
export const serviceStaff = pgTable('service_staff', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  serviceId:      uuid('service_id').notNull().references(() => catalogServices.id, { onDelete: 'cascade' }),
  profileId:      uuid('profile_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type CatalogCategory = typeof catalogCategories.$inferSelect;
export type NewCatalogCategory = typeof catalogCategories.$inferInsert;
export type CatalogService = typeof catalogServices.$inferSelect;
export type NewCatalogService = typeof catalogServices.$inferInsert;
export type ServiceStaff = typeof serviceStaff.$inferSelect;
