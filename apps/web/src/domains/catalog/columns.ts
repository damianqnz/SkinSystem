import 'server-only';

import { catalogCategories, catalogServices } from './schema';
import type { Result } from '@/shared/types/result';

/**
 * Shared query internals for the catalog domain: the explicit column
 * allow-lists every read projects (never `SELECT *`, so a new column never
 * leaks into a payload by default) and the domain's DB error shape.
 */

export const dbErr = (msg: string): Result<never> =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } });

export const CAT_COLS = {
  id:              catalogCategories.id,
  organizationId:  catalogCategories.organizationId,
  nameI18n:        catalogCategories.nameI18n,
  descriptionI18n: catalogCategories.descriptionI18n,
  sortOrder:       catalogCategories.sortOrder,
  isActive:        catalogCategories.isActive,
  isPublic:        catalogCategories.isPublic,
  createdAt:       catalogCategories.createdAt,
  updatedAt:       catalogCategories.updatedAt,
};

export const SVC_COLS = {
  id:                  catalogServices.id,
  organizationId:      catalogServices.organizationId,
  nameI18n:            catalogServices.nameI18n,
  descriptionI18n:     catalogServices.descriptionI18n,
  durationMinutes:     catalogServices.durationMinutes,
  priceCents:          catalogServices.priceCents,
  currency:            catalogServices.currency,
  depositPercent:      catalogServices.depositPercent,
  bufferBeforeMinutes: catalogServices.bufferBeforeMinutes,
  bufferAfterMinutes:  catalogServices.bufferAfterMinutes,
  isActive:            catalogServices.isActive,
  isPublic:            catalogServices.isPublic,
  sortOrder:           catalogServices.sortOrder,
  color:               catalogServices.color,
  slug:                catalogServices.slug,
  invasivenessLevel:   catalogServices.invasivenessLevel,
  coverImageUrl:       catalogServices.coverImageUrl,
  createdAt:           catalogServices.createdAt,
  updatedAt:           catalogServices.updatedAt,
};
