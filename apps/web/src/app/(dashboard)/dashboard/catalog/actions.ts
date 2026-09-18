'use server';

import { revalidatePath }              from 'next/cache';
import { headers }                     from 'next/headers';
import { getTranslations }             from 'next-intl/server';
import { z }                           from 'zod';
import { eq }                          from 'drizzle-orm';
import { db }                          from '@/infrastructure/db';
import { profiles }                    from '@/infrastructure/db/schema/organizations';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import { localeFromHeader }            from '@/i18n/detect-locale';
import {
  createCategory, updateCategory,
  createService,  updateService, toggleServiceStatus,
} from '@/domains/catalog/service';
import {
  createCategorySchema, createServiceSchema, updateServiceSchema,
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

// ── Auth helper ───────────────────────────────────────────────

async function getOrgId(): Promise<{ orgId: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const t = await getActionTranslations();
  if (!user) return { error: t('notAuthorized') };

  // organization_id is stored in user.user_metadata or we derive it from the session
  // For multi-tenant: each user belongs to exactly one org via profiles table
  // Fast path: JWT metadata
  const metaOrgId = user.user_metadata?.organization_id as string | undefined;
  if (metaOrgId) return { orgId: metaOrgId };
  // Fallback: profiles table (profiles.id === auth.users.id)
  const profileRows = await db.select({ organizationId: profiles.organizationId })
    .from(profiles).where(eq(profiles.id, user.id)).limit(1);
  const orgId = profileRows[0]?.organizationId;
  if (!orgId) return { error: t('orgNotFound') };
  return { orgId };
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
  if (result.error) return { status: 'error', message: result.error.message };

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
  const schema = z.object({
    id:      z.string().uuid(),
    nameI18n: z.object({ es: z.string().optional(), en: z.string().optional(), pt: z.string().optional() }),
    descriptionI18n: z.object({ es: z.string().optional(), en: z.string().optional(), pt: z.string().optional() }).optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const { id, ...patch } = parsed.data;
  const result = await updateCategory(id, auth.orgId, patch);
  if (result.error) return { status: 'error', message: result.error.message };

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
  if (result.error) return { status: 'error', message: result.error.message };

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
  const schema = updateServiceSchema.extend({ id: z.string().uuid() });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? t('invalidData') };
  }

  const { id, ...patch } = parsed.data;
  const result = await updateService(id, auth.orgId, patch);
  if (result.error) return { status: 'error', message: result.error.message };

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
  const parsed = z.object({ id: z.string().uuid(), isActive: z.boolean() }).safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: t('invalidData') };
  }

  const result = await toggleServiceStatus(parsed.data.id, auth.orgId, parsed.data.isActive);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/dashboard/catalog');
  const message = parsed.data.isActive ? t('serviceActivated') : t('serviceDeactivated');
  return { status: 'success', id: result.data.id, message };
}
