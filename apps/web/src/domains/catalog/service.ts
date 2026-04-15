import 'server-only';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { catalogServices } from './schema';
import type { SelectService } from './schema';
import type { Result } from '@/shared/types/result';

const dbErr = (msg: string) =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } }) as Result<never>;

const COLS = {
  id: catalogServices.id, organizationId: catalogServices.organizationId,
  categoryId: catalogServices.categoryId, nameI18n: catalogServices.nameI18n,
  descriptionI18n: catalogServices.descriptionI18n, durationMinutes: catalogServices.durationMinutes,
  priceCents: catalogServices.priceCents, currency: catalogServices.currency,
  depositPercent: catalogServices.depositPercent, color: catalogServices.color,
  sortOrder: catalogServices.sortOrder,
};

// ─────────────────────────────────────────────────────────────

/** Public booking + dashboard: active services for a tenant. */
export async function getActiveServices(
  organizationId: string,
): Promise<Result<SelectService[]>> {
  try {
    const data = await db
      .select(COLS)
      .from(catalogServices)
      .where(and(
        eq(catalogServices.organizationId, organizationId),
        eq(catalogServices.isActive, true),
      ))
      .orderBy(
        asc(catalogServices.sortOrder),
        asc(catalogServices.nameI18n),
      ) as SelectService[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch services');
  }
}
