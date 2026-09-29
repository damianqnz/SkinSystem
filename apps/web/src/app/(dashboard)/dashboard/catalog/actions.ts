'use server';

import { revalidatePath }              from 'next/cache';
import { idSchema } from '@/shared/lib/id-schema';
import { headers }                     from 'next/headers';
import { getTranslations }             from 'next-intl/server';
import { z }                           from 'zod';
import { resolveTenantOrgId }          from '@/shared/lib/resolve-tenant-org-id';
import { localeFromHeader }            from '@/i18n/detect-locale';
import { createCategory, updateCategory } from '@/domains/catalog/category';
import {
  createService, updateService, toggleServiceStatus,
} from '@/domains/catalog/service';
import {
  createCategorySchema, updateCategorySchema,
  createServiceSchema,  updateServiceSchema,
} from '@/domains/catalog/schema';

async function getActionTranslations() {
  const hdrs = await headers();
  return getTranslations({ locale: localeFromHeader(hdrs.get('x-locale')), namespace: 'dashboard.catalog.actions' });
}

// ── State types ───────────────────────────────────────────────

export type CatalogActionState =
  | { status: 'idle' }
  | { status: 'success'; id: string; message: string }
  | { status: 'error';   message: string };

type ActionTranslator = Awaited<ReturnType<typeof getActionTranslations>>;

/**
 * The domain layer's messages are English and meant for logs. Every code it
 * can return is translated here, so no raw domain text reaches a toast.
 */
function errorMessage(error: { message: string; code?: string }, t: ActionTranslator): string {
  switch (error.code) {
    case 'FORBIDDEN': return t('categoryNotInOrg');
    case 'NOT_FOUND': return t('notFound');
    default:          return t('writeFailed');
  }
}

// ── Auth helper ───────────────────────────────────────────────

/**
 * The tenant comes from an active membership in the request's tenant, never
 * from `user_metadata`: any signed-in user can rewrite their own metadata
 * through the Auth API, so trusting it let any account act on any tenant.
 */
async function getOrgId(): Promise<{ orgId: string } | { error: string }> {
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { error: auth.error };
  return { orgId: auth.orgId };
}

// ── Category actions ──────────────────────────────────────────

export async function createCategoryAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const t = await getActionTranslations();
  const parsed = createCategorySchema.safeParse({ ...raw as object, organizationId: auth.orgId });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const result = await createCategory(parsed.data);
  if (result.error) return { status: 'error', message: errorMessage(result.error, t) };

  revalidatePath('/dashboard/catalog');
  return { status: 'success', id: result.data.id, message: t('categoryCreated') };
}

export async function updateCategoryAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const t = await getActionTranslations();
  const schema = updateCategorySchema.extend({ id: idSchema });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const { id, ...patch } = parsed.data;
  const result = await updateCategory(id, auth.orgId, patch);
  if (result.error) return { status: 'error', message: errorMessage(result.error, t) };

  revalidatePath('/dashboard/catalog');
  return { status: 'success', id: result.data.id, message: t('categoryUpdated') };
}

// ── Service actions ───────────────────────────────────────────

export async function createServiceAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const t = await getActionTranslations();
  const parsed = createServiceSchema.safeParse({ ...raw as object, organizationId: auth.orgId });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const result = await createService(parsed.data);
  if (result.error) return { status: 'error', message: errorMessage(result.error, t) };

  revalidatePath('/dashboard/catalog');
  return { status: 'success', id: result.data.id, message: t('serviceCreated') };
}

export async function updateServiceAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const t = await getActionTranslations();
  const schema = updateServiceSchema.extend({ id: idSchema });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const { id, ...patch } = parsed.data;
  const result = await updateService(id, auth.orgId, patch);
  if (result.error) return { status: 'error', message: errorMessage(result.error, t) };

  revalidatePath('/dashboard/catalog');
  return { status: 'success', id: result.data.id, message: t('serviceUpdated') };
}

export async function toggleServiceStatusAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const t = await getActionTranslations();
  const parsed = z.object({ id: idSchema, isActive: z.boolean() }).safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: t('invalidData') };
  }

  const result = await toggleServiceStatus(parsed.data.id, auth.orgId, parsed.data.isActive);
  if (result.error) return { status: 'error', message: errorMessage(result.error, t) };

  revalidatePath('/dashboard/catalog');
  const message = parsed.data.isActive ? t('serviceActivated') : t('serviceDeactivated');
  return { status: 'success', id: result.data.id, message };
}
