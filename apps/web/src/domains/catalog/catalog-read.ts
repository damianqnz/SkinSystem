import 'server-only';

import { eq, and, asc } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { catalogCategories, catalogServices, serviceCategories } from './schema';
import { CAT_COLS, SVC_COLS, dbErr } from './columns';
import type { SelectCategory, SelectService } from './schema';
import type { Result } from '@/shared/types/result';

/**
 * Composite catalog reads — the grouped category/service shapes the dashboard
 * and the public tenant site render. Service CRUD lives in `service.ts`.
 */

/** A service annotated with every category id it belongs to (M:M via service_categories). */
export type ServiceRow = SelectService & { categoryIds: string[] };

export type CategoryWithServices = SelectCategory & {
  services: ServiceRow[];
};

async function fetchBridgeRows(organizationId: string): Promise<{ serviceId: string; categoryId: string }[]> {
  return db.select({ serviceId: serviceCategories.serviceId, categoryId: serviceCategories.categoryId })
    .from(serviceCategories)
    .where(eq(serviceCategories.organizationId, organizationId));
}

function groupByCategory(
  services: ServiceRow[],
): { catMap: Map<string, ServiceRow[]>; orphans: ServiceRow[] } {
  const catMap  = new Map<string, ServiceRow[]>();
  const orphans: ServiceRow[] = [];

  for (const svc of services) {
    if (svc.categoryIds.length === 0) { orphans.push(svc); continue; }
    for (const catId of svc.categoryIds) {
      const list = catMap.get(catId) ?? [];
      list.push(svc);
      catMap.set(catId, list);
    }
  }

  return { catMap, orphans };
}

/**
 * Fetch all categories + all services for a tenant, grouped via the
 * service_categories bridge (a service may belong to several categories —
 * OR semantics: it appears under every category it belongs to). Services
 * with zero bridge rows are returned as `orphans`.
 * Internal/dashboard use — no is_public filter. Tenant isolation: every
 * query filtered by `organizationId`.
 */
export async function getCategoriesWithServices(
  organizationId: string,
): Promise<Result<{ categories: CategoryWithServices[]; orphans: ServiceRow[] }>> {
  try {
    const [cats, svcs, bridge] = await Promise.all([
      db.select(CAT_COLS)
        .from(catalogCategories)
        .where(eq(catalogCategories.organizationId, organizationId))
        .orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.createdAt)),

      db.select(SVC_COLS)
        .from(catalogServices)
        .where(eq(catalogServices.organizationId, organizationId))
        .orderBy(asc(catalogServices.sortOrder), asc(catalogServices.createdAt)),

      fetchBridgeRows(organizationId),
    ]);

    const categoryIdsBySvc = new Map<string, string[]>();
    for (const row of bridge) {
      const list = categoryIdsBySvc.get(row.serviceId) ?? [];
      list.push(row.categoryId);
      categoryIdsBySvc.set(row.serviceId, list);
    }

    const rows: ServiceRow[] = svcs.map((svc) => ({ ...svc, categoryIds: categoryIdsBySvc.get(svc.id) ?? [] }));
    const { catMap, orphans } = groupByCategory(rows);

    const categories: CategoryWithServices[] = cats.map((c) => ({
      ...c,
      services: catMap.get(c.id) ?? [],
    }));

    return { data: { categories, orphans }, error: null };
  } catch {
    return dbErr('Failed to fetch catalog');
  }
}

/**
 * Public-safe catalog for the tenant landing/booking site. Filters at both
 * levels: a service shows under a category only when the service and that
 * specific category are each both is_active and is_public — public
 * visibility requires both flags, per the catalog_public_visibility
 * migration.
 * A service hidden in one category can still be public under another — OR
 * semantics, matching getCategoriesWithServices. Categories with no visible
 * services after filtering are dropped (nothing to render there publicly).
 */
export async function getPublicCatalog(
  organizationId: string,
): Promise<Result<{ categories: CategoryWithServices[] }>> {
  try {
    const [cats, svcs, bridge] = await Promise.all([
      db.select(CAT_COLS)
        .from(catalogCategories)
        .where(and(
          eq(catalogCategories.organizationId, organizationId),
          eq(catalogCategories.isActive, true),
          eq(catalogCategories.isPublic, true),
        ))
        .orderBy(asc(catalogCategories.sortOrder), asc(catalogCategories.createdAt)),

      db.select(SVC_COLS)
        .from(catalogServices)
        .where(and(
          eq(catalogServices.organizationId, organizationId),
          eq(catalogServices.isActive, true),
          eq(catalogServices.isPublic, true),
        ))
        .orderBy(asc(catalogServices.sortOrder), asc(catalogServices.createdAt)),

      fetchBridgeRows(organizationId),
    ]);

    const publicCatIds = new Set(cats.map((c) => c.id));
    const publicSvcIds = new Set(svcs.map((s) => s.id));

    const categoryIdsBySvc = new Map<string, string[]>();
    for (const row of bridge) {
      if (!publicCatIds.has(row.categoryId) || !publicSvcIds.has(row.serviceId)) continue;
      const list = categoryIdsBySvc.get(row.serviceId) ?? [];
      list.push(row.categoryId);
      categoryIdsBySvc.set(row.serviceId, list);
    }

    const rows: ServiceRow[] = svcs.map((svc) => ({ ...svc, categoryIds: categoryIdsBySvc.get(svc.id) ?? [] }));
    const { catMap } = groupByCategory(rows);

    const categories: CategoryWithServices[] = cats
      .map((c) => ({ ...c, services: catMap.get(c.id) ?? [] }))
      .filter((c) => c.services.length > 0);

    return { data: { categories }, error: null };
  } catch {
    return dbErr('Failed to fetch public catalog');
  }
}
