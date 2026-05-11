import {
  pgTable,
  uuid,
  text,
  boolean,
  jsonb,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { userRoleEnum } from './enums';

// ── organizations ────────────────────────────────────────────
export const organizations = pgTable('organizations', {
  id:                 uuid('id').primaryKey().defaultRandom(),
  slug:               text('slug').notNull().unique(),
  name:               text('name').notNull(),
  legalName:          text('legal_name'),
  taxId:              text('tax_id'),
  timezone:           text('timezone').notNull().default('Europe/Lisbon'),
  locale:             text('locale').notNull().default('pt'),
  /** CSS variable tokens: { brand_color, button_style, theme_mode } */
  themeConfig:        jsonb('theme_config').notNull().default({}),
  stripeAccountId:      text('stripe_account_id'),
  stripeOnboarded:      boolean('stripe_onboarded').notNull().default(false),
  stripeChargesEnabled: boolean('stripe_charges_enabled').notNull().default(false),
  customRedirectUrl:  text('custom_redirect_url'),
  autoRedirect:       boolean('auto_redirect').notNull().default(false),
  isActive:           boolean('is_active').notNull().default(true),
  // Added Phase 2
  address:            text('address'),
  logoUrl:            text('logo_url'),
  thankYouUrl:        text('thank_you_url'),
  // Added Phase 5
  bannerUrl:          text('banner_url'),
  industry:           text('industry'),
  about:              text('about'),
  city:               text('city'),
  state:              text('state'),
  postalCode:         text('postal_code'),
  country:            text('country'),
  defaultCurrency:    text('default_currency').notNull().default('EUR'),
  primaryEmail:       text('primary_email'),
  /** { website, instagram, facebook, tiktok, x, youtube, linkedin, custom: {label, url} } */
  socialLinks:        jsonb('social_links').notNull().default({}),
  createdAt:          timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:          timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ── profiles ─────────────────────────────────────────────────
// profiles.id = auth.users.id (Supabase Auth — FK enforced in DB, not Drizzle)
export const profiles = pgTable('profiles', {
  id:             uuid('id').primaryKey(),
  organizationId: uuid('organization_id').notNull().references(() => organizations.id, { onDelete: 'cascade' }),
  role:           userRoleEnum('role').notNull().default('staff'),
  fullName:       text('full_name'),
  avatarUrl:      text('avatar_url'),
  phone:          text('phone'),
  /** NULL = no explicit preference (fallback Accept-Language). Constrained at DB level to 'es'|'pt'|'en'. */
  locale:         text('locale'),
  isActive:       boolean('is_active').notNull().default(true),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Organization = typeof organizations.$inferSelect;
export type NewOrganization = typeof organizations.$inferInsert;
export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
