import 'server-only';

import { eq, and, asc } from 'drizzle-orm';
import { db }              from '@/infrastructure/db';
import { catalogCategories, catalogServices } from './schema';
import type {
  SelectCategory,
  SelectService,
  CreateCategoryInput,
  CreateServiceInput,
  UpdateServiceInput,
} from './schema';
import type { Result } from '@/shared/types/result';

// ── Helpers ───────────────────────────────────────────────────

const dbErr = (msg: string): Result<never> =>
  ({ data: null, error: { message: msg, code: 'DB_ERROR' } });

const CAT_COLS = {
  id:              catalogCategories.id,
  organizationId:  catalogCategories.organizationId,
  nameI18n:        catalogCategories.nameI18n,
  descriptionI18n: catalogCategories.descriptionI18n,
  sortOrder:       catalogCategories.sortOrder,
  isActive:        catalogCategories.isActive,
  createdAt:       catalogCategories.createdAt,
  updatedAt:       catalogCategories.updatedAt,
};

const SVC_COLS = {
  id:                  catalogServices.id,
  organizationId:      catalogServices.organizationId,
  categoryId:          catalogServices.categoryId,
  nameI18n:            catalogServices.nameI18n,
  descriptionI18n:     catalogServices.descriptionI18n,
  durationMinutes:     catalogServices.durationMinutes,
  priceCents:          catalogServices.priceCents,
  currency:            catalogServices.currency,
  depositPercent:      catalogServices.depositPercent,
  bufferBeforeMinutes: catalogServices.bufferBeforeMinutes,
  bufferAfterMinutes:  catalogServices.bufferAfterMinutes,
  isActive:            catalogServices.isActive,
  sortOrder:           catalogServices.sortOrder,
  color:               catalogServices.color,
  slug:                catalogServices.slug,
  invasivenessLevel:   catalogServices.invasivenessLevel,
  coverImageUrl:       catalogServices.coverImageUrl,
  createdAt:           catalogServices.createdAt,
  updatedAt:           catalogServices.updatedAt,
};

// ── Composite read ────────────────────────────────────────────

export type ServiceRow = SelectService;

export type CategoryWithServices = SelectCategory & {
  services: ServiceRow[];
};

/**
 * Fetch all categories + all services for a tenant, grouped in JS.
 * Services without categoryId are returned as `orphans`.
 * Tenant isolation: every query filtered by `organizationId`.
 */
export async function getCategoriesWithServices(
  organizationId: string,
): Promise<Result<{ categories: CategoryWithServices[]; orphans: ServiceRow[] }>> {
  try {
    const [cats, svcs] = await Promise.all([
      db.select(CAT_COLS)
        .from(catalogCategories)
        .where(eq(catalogCategories.organizationId, organizationId))
        .orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.createdAt)),

      db.select(SVC_COLS)
        .from(catalogServices)
        .where(eq(catalogServices.organizationId, organizationId))
        .orderBy(asc(catalogServices.sortOrder), asc(catalogServices.createdAt)),
    ]);

    const catMap = new Map<string, ServiceRow[]>();
    const orphans: ServiceRow[] = [];

    for (const svc of svcs) {
      if (!svc.categoryId) { orphans.push(svc); continue; }
      const list = catMap.get(svc.categoryId) ?? [];
      list.push(svc);
      catMap.set(svc.categoryId, list);
    }

    const categories: CategoryWithServices[] = cats.map((c) => ({
      ...c,
      services: catMap.get(c.id) ?? [],
    }));

    return { data: { categories, orphans }, error: null };
  } catch {
    return dbErr('Failed to fetch catalog');
  }
}

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

// ── Category CRUD ─────────────────────────────────────────────

export async function createCategory(
  input: CreateCategoryInput,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .insert(catalogCategories)
      .values({
        organizationId:  input.organizationId,
        nameI18n:        input.nameI18n,
        descriptionI18n: input.descriptionI18n ?? {},
        sortOrder:       input.sortOrder ?? 0,
        isActive:        input.isActive ?? true,
      })
      .returning({ id: catalogCategories.id });
    if (!rows[0]) return dbErr('Insert returned empty');
    return { data: { id: rows[0].id }, error: null };
  } catch {
    return dbErr('Failed to create category');
  }
}

export async function updateCategory(
  id:             string,
  organizationId: string,
  patch:          Partial<Pick<SelectCategory, 'nameI18n' | 'descriptionI18n' | 'sortOrder' | 'isActive'>>,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .update(catalogCategories)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(
        eq(catalogCategories.id, id),
        eq(catalogCategories.organizationId, organizationId),
      ))
      .returning({ id: catalogCategories.id });
    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Category not found', code: 'NOT_FOUND' } };
    return { data: { id: row.id }, error: null };
  } catch {
    return dbErr('Failed to update category');
  }
}

// ── Service CRUD ──────────────────────────────────────────────

export async function createService(
  input: CreateServiceInput,
): Promise<Result<{ id: string }>> {
  try {
    const rows = await db
      .insert(catalogServices)
      .values({
        organizationId:      input.organizationId,
        categoryId:          input.categoryId ?? null,
        nameI18n:            input.nameI18n,
        descriptionI18n:     input.descriptionI18n ?? {},
        durationMinutes:     input.durationMinutes,
        priceCents:          input.priceCents,
        currency:            input.currency ?? 'EUR',
        bufferBeforeMinutes: input.bufferBeforeMinutes ?? 0,
        bufferAfterMinutes:  input.bufferAfterMinutes ?? 0,
        depositPercent:      input.depositPercent ?? 100,
        isActive:            input.isActive ?? true,
        color:               input.color ?? null,
      })
      .returning({ id: catalogServices.id });
    if (!rows[0]) return dbErr('Insert returned empty');
    return { data: { id: rows[0].id }, error: null };
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
    const rows = await db
      .update(catalogServices)
      .set({ ...patch, updatedAt: new Date() })
      .where(and(
        eq(catalogServices.id, id),
        eq(catalogServices.organizationId, organizationId),
      ))
      .returning({ id: catalogServices.id });
    const row = rows[0];
    if (!row) return { data: null, error: { message: 'Service not found', code: 'NOT_FOUND' } };
    return { data: { id: row.id }, error: null };
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
