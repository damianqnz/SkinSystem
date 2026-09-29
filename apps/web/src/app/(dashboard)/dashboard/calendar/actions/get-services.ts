'use server';
import 'server-only';

import { resolveTenantOrgId }    from '@/shared/lib/resolve-tenant-org-id';
import { getActiveServices }             from '@/domains/catalog/service';
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
  // Tenant from an active membership in the request's tenant — never from
  // user_metadata, which the signed-in user can rewrite via the Auth API.
  const auth = await resolveTenantOrgId();
  if ('error' in auth) return { data: null, error: { message: auth.error, code: 'AUTH_ERROR' } };
  const { orgId } = auth;

  const result = await getActiveServices(orgId);
  if (result.error) return { data: null, error: result.error };

  const options: ServiceOption[] = (result.data ?? []).map((s) => ({
    id:              s.id,
    name:            resolveName(s.nameI18n, locale),
    durationMinutes: s.durationMinutes,
  }));

  return { data: options, error: null };
}
