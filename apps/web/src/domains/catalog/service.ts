import 'server-only';

import { eq, and, asc, inArray } from 'drizzle-orm';
import { db }              from '@/infrastructure/db';
import { organizations }   from '@/infrastructure/db/schema/organizations';
import { catalogCategories, catalogServices, serviceCategories } from './schema';
import { SVC_COLS, dbErr } from './columns';
import type {
  SelectService,
  CreateServiceInput,
  UpdateServiceInput,
} from './schema';
import type { Result } from '@/shared/types/result';

// ── Helpers ───────────────────────────────────────────────────

/**
 * categoryIds arrive from client input validated only as UUIDs, so a caller
 * could name a category belonging to another tenant: the bridge's foreign key
 * proves the category exists somewhere, not that it belongs to this org.
 */
async function findForeignCategoryIds(
  organizationId: string,
  categoryIds:    string[],
): Promise<string[]> {
  if (categoryIds.length === 0) return [];
  const owned = await db
    .select({ id: catalogCategories.id })
    .from(catalogCategories)
    .where(and(
      eq(catalogCategories.organizationId, organizationId),
      inArray(catalogCategories.id, categoryIds),
    ));
  const ownedIds = new Set(owned.map((row) => row.id));
  return categoryIds.filter((id) => !ownedIds.has(id));
}

const foreignCategoryErr = (): Result<never> =>
  ({ data: null, error: { message: 'Category does not belong to this organization', code: 'FORBIDDEN' } });

/** Active services only — for booking/calendar (public-facing). */
export async function getActiveServices(
  organizationId: string,
): Promise<Result<SelectService[]>> {
  try {
    const data = await db
      .select(SVC_COLS)
      .from(catalogServices)
      .where(and(
        eq(catalogServices.organizationId, organizationId),
        eq(catalogServices.isActive, true),
      ))
      .orderBy(asc(catalogServices.sortOrder)) as SelectService[];
    return { data, error: null };
  } catch {
    return dbErr('Failed to fetch services');
  }
}

/** Single service by ID — validates tenant ownership. */
export async function getServiceById(
  id:             string,
  organizationId: string,
): Promise<Result<SelectService>> {
  try {
    const rows = await db
      .select(SVC_COLS)
      .from(catalogServices)
      .where(and(
        eq(catalogServices.id, id),
        eq(catalogServices.organizationId, organizationId),
      ))
      .limit(1);
    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Service not found', code: 'NOT_FOUND' } };
    return { data: row as SelectService, error: null };
  } catch {
    return dbErr('Failed to fetch service');
  }
}

// ── Service CRUD ──────────────────────────────────────────────

export async function createService(
  input: CreateServiceInput,
): Promise<Result<{ id: string }>> {
  try {
    let currency = input.currency;
    if (!currency) {
      const orgRows = await db
        .select({ defaultCurrency: organizations.defaultCurrency })
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);
      currency = orgRows[0]?.defaultCurrency ?? 'EUR';
    }

    const categoryIds = [...new Set(input.categoryIds ?? [])];
    if ((await findForeignCategoryIds(input.organizationId, categoryIds)).length > 0) {
      return foreignCategoryErr();
    }

    const id = await db.transaction(async (tx) => {
      const rows = await tx
        .insert(catalogServices)
        .values({
          organizationId:      input.organizationId,
          nameI18n:            input.nameI18n,
          descriptionI18n:     input.descriptionI18n ?? {},
          durationMinutes:     input.durationMinutes,
          priceCents:          input.priceCents,
          currency,
          bufferBeforeMinutes: input.bufferBeforeMinutes ?? 0,
          bufferAfterMinutes:  input.bufferAfterMinutes ?? 0,
          depositPercent:      input.depositPercent ?? 100,
          isActive:            input.isActive ?? true,
          isPublic:            input.isPublic ?? true,
          color:               input.color ?? null,
        })
        .returning({ id: catalogServices.id });
      const newId = rows[0]?.id;
      if (!newId) throw new Error('Insert returned empty');

      if (categoryIds.length > 0) {
        await tx.insert(serviceCategories).values(
          categoryIds.map((categoryId) => ({
            organizationId: input.organizationId,
            serviceId:      newId,
            categoryId,
          })),
        );
      }

      return newId;
    });

    return { data: { id }, error: null };
  } catch {
    return dbErr('Failed to create service');
  }
}

export async function updateService(
  id:             string,
  organizationId: string,
  patch:          UpdateServiceInput,
): Promise<Result<{ id: string }>> {
  try {
    const { categoryIds: rawCategoryIds, ...fields } = patch;
    const categoryIds = rawCategoryIds && [...new Set(rawCategoryIds)];
    if (categoryIds && (await findForeignCategoryIds(organizationId, categoryIds)).length > 0) {
      return foreignCategoryErr();
    }

    const updatedId = await db.transaction(async (tx) => {
      const rows = await tx
        .update(catalogServices)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(
          eq(catalogServices.id, id),
          eq(catalogServices.organizationId, organizationId),
        ))
        .returning({ id: catalogServices.id });
      const row = rows[0];
      if (!row) return null;

      if (categoryIds !== undefined) {
        await tx.delete(serviceCategories).where(and(
          eq(serviceCategories.serviceId, row.id),
          eq(serviceCategories.organizationId, organizationId),
        ));
        if (categoryIds.length > 0) {
          await tx.insert(serviceCategories).values(
            categoryIds.map((categoryId) => ({ organizationId, serviceId: row.id, categoryId })),
          );
        }
      }

      return row.id;
    });

    if (!updatedId) return { data: null, error: { message: 'Service not found', code: 'NOT_FOUND' } };
    return { data: { id: updatedId }, error: null };
  } catch {
    return dbErr('Failed to update service');
  }
}

/** Toggle isActive atomically — no other fields touched. */
export async function toggleServiceStatus(
  id:             string,
  organizationId: string,
  isActive:       boolean,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(catalogServices)
      .set({ isActive, updatedAt: new Date() })
      .where(and(
        eq(catalogServices.id, id),
        eq(catalogServices.organizationId, organizationId),
      ))
      .returning({ id: catalogServices.id });
    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Service not found', code: 'NOT_FOUND' } };
    return { data: { id: row.id }, error: null };
  } catch {
    return dbErr('Failed to toggle service status');
  }
}
