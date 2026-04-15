/**
 * @domain catalog
 * @description Public schema surface for the Catalog domain.
 *
 * Covers: service categories and bookable services.
 * Prices are stored in cents (smallest currency unit) to avoid float errors.
 * Names/descriptions use i18n JSONB: { es: "...", en: "...", pt: "..." }
 *
 * organization_id is MANDATORY in every query — enforced by RLS + app layer.
 */

import { z } from 'zod';
import {
  catalogCategories,
  catalogServices,
  serviceStaff,
  type CatalogCategory,
  type NewCatalogCategory,
  type CatalogService,
  type NewCatalogService,
  type ServiceStaff,
} from '@/infrastructure/db/schema/catalog';

// ── Table references (Drizzle) ────────────────────────────────
export { catalogCategories, catalogServices, serviceStaff };

// ── Inferred types ────────────────────────────────────────────
export type {
  CatalogCategory,
  NewCatalogCategory,
  CatalogService,
  NewCatalogService,
  ServiceStaff,
};

// Short domain aliases
export type SelectCategory = CatalogCategory;
export type InsertCategory = NewCatalogCategory;
export type SelectService  = CatalogService;
export type InsertService  = NewCatalogService;

// ── i18n JSONB helper type ─────────────────────────────────────
export type I18nField = { es?: string; en?: string; pt?: string };

const i18nSchema = z.object({
  es: z.string().optional(),
  en: z.string().optional(),
  pt: z.string().optional(),
});

// ── Zod validators ────────────────────────────────────────────

export const createCategorySchema = z.object({
  organizationId:  z.string().uuid(),
  nameI18n:        i18nSchema,
  descriptionI18n: i18nSchema.optional(),
  sortOrder:       z.number().int().nonnegative().optional().default(0),
  isActive:        z.boolean().optional().default(true),
});

export const createServiceSchema = z.object({
  organizationId:      z.string().uuid(),
  categoryId:          z.string().uuid().nullable().optional(),
  nameI18n:            i18nSchema,
  descriptionI18n:     i18nSchema.optional(),
  /** Duration in minutes */
  durationMinutes:     z.number().int().positive(),
  /** Price in cents (e.g. 5000 = €50.00) */
  priceCents:          z.number().int().nonnegative(),
  currency:            z.string().length(3).optional().default('EUR'),
  bufferBeforeMinutes: z.number().int().nonnegative().optional().default(0),
  bufferAfterMinutes:  z.number().int().nonnegative().optional().default(0),
  depositPercent:      z.number().int().min(0).max(100).optional().default(100),
  isActive:            z.boolean().optional().default(true),
  color:               z.string().regex(/^#[0-9A-Fa-f]{6}$/).nullable().optional(),
});

export const updateServiceSchema = createServiceSchema
  .omit({ organizationId: true })
  .partial();

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateServiceInput  = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput  = z.infer<typeof updateServiceSchema>;
