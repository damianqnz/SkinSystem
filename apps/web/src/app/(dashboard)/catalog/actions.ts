'use server';

import { revalidatePath }              from 'next/cache';
import { z }                           from 'zod';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import {
  createCategory, updateCategory,
  createService,  updateService, toggleServiceStatus,
} from '@/domains/catalog/service';
import {
  createCategorySchema, createServiceSchema, updateServiceSchema,
} from '@/domains/catalog/schema';

// ── State types ───────────────────────────────────────────────

export type CatalogActionState =
  | { status: 'idle' }
  | { status: 'success'; id: string; message: string }
  | { status: 'error';   message: string };

// ── Auth helper ───────────────────────────────────────────────

async function getOrgId(): Promise<{ orgId: string } | { error: string }> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autorizado' };

  // organization_id is stored in user.user_metadata or we derive it from the session
  // For multi-tenant: each user belongs to exactly one org via profiles table
  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { error: 'Organización no encontrada en sesión' };
  return { orgId };
}

// ── Category actions ──────────────────────────────────────────

export async function createCategoryAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const parsed = createCategorySchema.safeParse({ ...raw as object, organizationId: auth.orgId });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const result = await createCategory(parsed.data);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/catalog');
  return { status: 'success', id: result.data.id, message: 'Categoría creada' };
}

export async function updateCategoryAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const schema = z.object({
    id:      z.string().uuid(),
    nameI18n: z.object({ es: z.string().optional(), en: z.string().optional(), pt: z.string().optional() }),
    descriptionI18n: z.object({ es: z.string().optional(), en: z.string().optional(), pt: z.string().optional() }).optional(),
    isActive: z.boolean().optional(),
  });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { id, ...patch } = parsed.data;
  const result = await updateCategory(id, auth.orgId, patch);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/catalog');
  return { status: 'success', id: result.data.id, message: 'Categoría actualizada' };
}

// ── Service actions ───────────────────────────────────────────

export async function createServiceAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const parsed = createServiceSchema.safeParse({ ...raw as object, organizationId: auth.orgId });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const result = await createService(parsed.data);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/catalog');
  return { status: 'success', id: result.data.id, message: 'Servicio creado' };
}

export async function updateServiceAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const schema = updateServiceSchema.extend({ id: z.string().uuid() });
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Datos inválidos' };
  }

  const { id, ...patch } = parsed.data;
  const result = await updateService(id, auth.orgId, patch);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/catalog');
  return { status: 'success', id: result.data.id, message: 'Servicio actualizado' };
}

export async function toggleServiceStatusAction(
  _prev: CatalogActionState,
  raw:   unknown,
): Promise<CatalogActionState> {
  const auth = await getOrgId();
  if ('error' in auth) return { status: 'error', message: auth.error };

  const parsed = z.object({ id: z.string().uuid(), isActive: z.boolean() }).safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: 'Datos inválidos' };
  }

  const result = await toggleServiceStatus(parsed.data.id, auth.orgId, parsed.data.isActive);
  if (result.error) return { status: 'error', message: result.error.message };

  revalidatePath('/catalog');
  const label = parsed.data.isActive ? 'activado' : 'desactivado';
  return { status: 'success', id: result.data.id, message: `Servicio ${label}` };
}
