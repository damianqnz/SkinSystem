import 'server-only';

import { eq, and } from 'drizzle-orm';
import { db } from '@/infrastructure/db';
import { catalogCategories } from './schema';
import { dbErr } from './columns';
import type { SelectCategory, CreateCategoryInput } from './schema';
import type { Result } from '@/shared/types/result';

/** Category CRUD. Service CRUD lives in `service.ts`, composite reads in `catalog-read.ts`. */

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
        isPublic:        input.isPublic ?? true,
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
  patch:          Partial<Pick<SelectCategory, 'nameI18n' | 'descriptionI18n' | 'sortOrder' | 'isActive' | 'isPublic'>>,
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
