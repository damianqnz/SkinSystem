'use server';

import 'server-only';
import { headers } from 'next/headers';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getCustomersWithStats } from '@/domains/customers/service';
import type { Result } from '@/shared/types/result';

export type ExportResult = { csv: string; filename: string };

const STATUS_LABELS: Record<string, Record<string, string>> = {
  nuevo:      { es: 'Nuevo',       pt: 'Novo',        en: 'New'       },
  recurrente: { es: 'Recurrente',  pt: 'Recorrente',  en: 'Returning' },
  riesgo:     { es: 'Riesgo',      pt: 'Risco',       en: 'At Risk'   },
  inactivo:   { es: 'Inactivo',    pt: 'Inativo',     en: 'Inactive'  },
  perdido:    { es: 'Perdido',     pt: 'Perdido',     en: 'Lost'      },
};

function fmtDate(d: Date | null, locale: string): string {
  if (!d) return '';
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  return new Date(d).toLocaleDateString(tag, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function esc(v: string | null | undefined): string {
  const s = v ?? '';
  return /[,"\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function exportCustomersAction(): Promise<Result<ExportResult>> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { data: null, error: { message: 'Unauthorized', code: 'AUTH_ERROR' } };

  const orgId = user.user_metadata.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: 'No organization', code: 'AUTH_ERROR' } };

  const h      = await headers();
  const locale = h.get('x-locale') ?? 'es';

  const result = await getCustomersWithStats(orgId);
  if (result.error) return { data: null, error: result.error };

  const COLS = locale === 'pt'
    ? ['Nome', 'Email', 'Telefone', 'Estado', 'Última visita', 'Total visitas']
    : locale === 'en'
    ? ['Name', 'Email', 'Phone', 'Status', 'Last visit', 'Total visits']
    : ['Nombre', 'Email', 'Teléfono', 'Estado', 'Última visita', 'Total visitas'];

  const rows = (result.data ?? []).map(c =>
    [
      esc(c.fullName),
      esc(c.email),
      esc(c.phone),
      esc(STATUS_LABELS[c.status]?.[locale] ?? c.status),
      esc(fmtDate(c.lastVisitAt, locale)),
      String(c.visitCount),
    ].join(','),
  );

  const csv      = [COLS.join(','), ...rows].join('\n');
  const date     = new Date().toISOString().slice(0, 10);
  const filename = `clientes_export_${date}.csv`;

  return { data: { csv, filename }, error: null };
}
