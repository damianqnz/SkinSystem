import {
  pgTable,
  uuid,
  text,
  boolean,
  smallint,
  date,
  timestamp,
  jsonb,
  unique,
} from 'drizzle-orm/pg-core';
import {
  skinTypeEnum,
  hydrationLevelEnum,
  skinTextureEnum,
  severityLevelEnum,
} from './enums';
import { organizations } from './organizations';

// ── customers ─────────────────────────────────────────────────
export const customers = pgTable('customers', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  fullName:       text('full_name').notNull(),
  phone:          text('phone'),
  email:          text('email'),
  isGuest:        boolean('is_guest').notNull().default(false),
  notes:          text('notes'),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── customer_onboarding ───────────────────────────────────────
// 1:1 with customers. Sensitive fields MUST be AES-256 encrypted at app layer.
export const customerOnboarding = pgTable('customer_onboarding', {
  id:                        uuid('id').primaryKey().defaultRandom(),
  organizationId:            uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:                uuid('customer_id').notNull().unique().references(() => customers.id, { onDelete: 'cascade' }),
  birthDate:                 date('birth_date'),
  emergencyContactName:      text('emergency_contact_name'),
  emergencyContactPhone:     text('emergency_contact_phone'),
  emergencyContactRelation:  text('emergency_contact_relation'),
  isSmoker:                  boolean('is_smoker').notNull().default(false),
  isPregnant:                boolean('is_pregnant').notNull().default(false),
  pregnancyDueDate:          date('pregnancy_due_date'),
  /** ENCRYPTED AES-256 at application layer */
  allergies:                 text('allergies'),
  /** ENCRYPTED AES-256 at application layer */
  medications:               text('medications'),
  /** ENCRYPTED AES-256 at application layer */
  chronicConditions:         text('chronic_conditions'),
  onboardingCompletedAt:     timestamp('onboarding_completed_at', { withTimezone: true }),
  createdAt:                 timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:                 timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── skin_conditions ───────────────────────────────────────────
// Master catalog of skin pathologies per organization
export const skinConditions = pgTable('skin_conditions', {
  id:             uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  /** { es: "...", en: "...", pt: "..." } */
  name:           jsonb('name').notNull().default({}),
  slug:           text('slug').notNull(),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique('uq_skin_condition_slug').on(t.organizationId, t.slug),
]);

// ── customer_skin_profile ─────────────────────────────────────
// 1:1 with customers — base technical diagnosis
export const customerSkinProfile = pgTable('customer_skin_profile', {
  id:              uuid('id').primaryKey().defaultRandom(),
  organizationId:  uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:      uuid('customer_id').notNull().unique().references(() => customers.id, { onDelete: 'cascade' }),
  fitzpatrickType: smallint('fitzpatrick_type'),
  skinType:        skinTypeEnum('skin_type'),
  hydrationLevel:  hydrationLevelEnum('hydration_level'),
  texture:         skinTextureEnum('texture'),
  notes:           text('notes'),
  lastEvaluatedAt: timestamp('last_evaluated_at', { withTimezone: true }),
  createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:       timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── customer_skin_conditions ──────────────────────────────────
// Relational customer ↔ pathology (avoids array anti-pattern)
export const customerSkinConditions = pgTable('customer_skin_conditions', {
  id:               uuid('id').primaryKey().defaultRandom(),
  organizationId:   uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  customerId:       uuid('customer_id').notNull().references(() => customers.id, { onDelete: 'cascade' }),
  skinConditionId:  uuid('skin_condition_id').notNull().references(() => skinConditions.id),
  detectedAt:       date('detected_at'),
  resolvedAt:       date('resolved_at'),
  severity:         severityLevelEnum('severity'),
  notes:            text('notes'),
  createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Customer = typeof customers.$inferSelect;
export type NewCustomer = typeof customers.$inferInsert;
export type CustomerOnboarding = typeof customerOnboarding.$inferSelect;
export type CustomerSkinProfile = typeof customerSkinProfile.$inferSelect;
export type SkinCondition = typeof skinConditions.$inferSelect;
