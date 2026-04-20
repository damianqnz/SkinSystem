'use server';

import 'server-only';

import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getActiveServices } from '@/domains/catalog/service';
import type { Result } from '@/shared/types/result';
import type { I18nField } from '@/domains/catalog/schema';

// ── Public type ───────────────────────────────────────────────
export type ServiceOption = {
  id:              string;
  name:            string;
  durationMinutes: number;
};

// ── Helper: resolve locale-aware name ────────────────────────
function resolveName(nameI18n: unknown, locale: string): string {
  const field = nameI18n as I18nField | null;
  if (!field) return '—';
  const lang = locale.slice(0, 2) as keyof I18nField;
  return field[lang] ?? field['es'] ?? Object.values(field).find(Boolean) ?? '—';
}

// ── Action ────────────────────────────────────────────────────
export async function getServicesAction(
  locale: string,
): Promise<Result<ServiceOption[]>> {
  // Auth — orgId ALWAYS from session (not spoofable)
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: 'No autorizado', code: 'AUTH_ERROR' } };

  const orgId = user.user_metadata?.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: 'Organización no encontrada', code: 'NOT_FOUND' } };

  const result = await getActiveServices(orgId);
  if (result.error) return { data: null, error: result.error };

  const options: ServiceOption[] = (result.data ?? []).map((s) => ({
    id:              s.id,
    name:            resolveName(s.nameI18n, locale),
    durationMinutes: s.durationMinutes,
  }));

  return { data: options, error: null };
}
