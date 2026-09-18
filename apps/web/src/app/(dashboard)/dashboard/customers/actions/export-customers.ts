'use server';

import 'server-only';
import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getCustomersWithStats } from '@/domains/customers/service';
import { localeFromHeader } from '@/i18n/detect-locale';
import type { Result } from '@/shared/types/result';

export type ExportResult = { csv: string; filename: string };

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

  const h      = await headers();
  const locale = localeFromHeader(h.get('x-locale'));
  const [tActions, tStatus, tCols] = await Promise.all([
    getTranslations({ locale, namespace: 'dashboard.customers.actions' }),
    getTranslations({ locale, namespace: 'customers.status' }),
    getTranslations({ locale, namespace: 'dashboard.customers.export.columns' }),
  ]);

  if (!user) return { data: null, error: { message: tActions('unauthorized'), code: 'AUTH_ERROR' } };

  const orgId = user.user_metadata.organization_id as string | undefined;
  if (!orgId) return { data: null, error: { message: tActions('noOrganization'), code: 'AUTH_ERROR' } };

  const result = await getCustomersWithStats(orgId);
  if (result.error) return { data: null, error: result.error };

  const COLS = [
    tCols('name'), tCols('email'), tCols('phone'),
    tCols('status'), tCols('lastVisit'), tCols('totalVisits'),
  ];

  const rows = (result.data ?? []).map(c =>
    [
      esc(c.fullName),
      esc(c.email),
      esc(c.phone),
      esc(tStatus.has(c.status) ? tStatus(c.status) : c.status),
      esc(fmtDate(c.lastVisitAt, locale)),
      String(c.visitCount),
    ].join(','),
  );

  const csv      = [COLS.join(','), ...rows].join('\n');
  const date     = new Date().toISOString().slice(0, 10);
  const filename = `clientes_export_${date}.csv`;

  return { data: { csv, filename }, error: null };
}
