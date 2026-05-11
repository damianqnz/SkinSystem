'use client';

import { useState, useEffect } from 'react';
import { CalendarX } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { getCustomerAppointmentsAction } from '../../actions/get-customer-appointments';
import type { AppointmentHistoryData, AppointmentHistoryItem } from '@/domains/customers/service-appointments';

// ── Helpers ──────────────────────────────────────────────────────
const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

function svcName(name: Record<string, string> | null, locale: string): string {
  if (!name) return '—';
  return name[locale] ?? name['es'] ?? Object.values(name)[0] ?? '—';
}

function fmtEur(cents: number | null): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

const STATUS_CLS: Record<string, string> = {
  pending:   'bg-amber-50   text-amber-700   border-amber-200',
  confirmed: 'bg-sky-50     text-sky-700     border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-stone-50   text-stone-500   border-stone-200',
  no_show:   'bg-rose-50    text-rose-600    border-rose-200',
};

// ── Sub-components ────────────────────────────────────────────────
function StatCard({ value, label, hint }: { value: string | number; label: string; hint: string }) {
  return (
    <div className="p-4 border border-stone-200 rounded-sm bg-white space-y-1 cursor-default
                    transition-all duration-150
                    hover:border-[#D4AF37]/50 hover:shadow-sm hover:scale-[1.02]">
      <p className="font-sans text-2xl font-light text-stone-900 tabular-nums">{value}</p>
      <p className="font-sans text-[10px] uppercase tracking-wider text-stone-600">{label}</p>
      <p className="font-sans text-[10px] text-stone-400 leading-snug">{hint}</p>
    </div>
  );
}

function ApptRow({ item, locale, statusLabels }: { item: AppointmentHistoryItem; locale: string; statusLabels: Record<string, string> }) {
  const intlLocale = INTL_LOCALE_MAP[locale] ?? 'pt-PT';
  const d    = new Date(item.startAt);
  const date = d.toLocaleDateString(intlLocale,  { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const time = d.toLocaleTimeString(intlLocale,  { hour: '2-digit', minute: '2-digit' });
  const statusCls   = STATUS_CLS[item.status] ?? STATUS_CLS.pending!;
  const statusLabel = statusLabels[item.status] ?? item.status;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      <div className="w-32 shrink-0">
        <p className="font-sans text-xs text-stone-700 leading-snug">{date}</p>
        <p className="font-sans text-[11px] text-stone-400">{time}</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-stone-800 truncate">{svcName(item.serviceName, locale)}</p>
        {item.staffName && <p className="font-sans text-[11px] text-stone-400 truncate">{item.staffName}</p>}
      </div>
      <div className="shrink-0 flex flex-col items-end gap-1">
        <span className={`font-sans text-[10px] px-1.5 py-0.5 border rounded-sm ${statusCls}`}>{statusLabel}</span>
        <span className="font-sans text-xs text-stone-500 tabular-nums">{fmtEur(item.totalCents)}</span>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 gap-3">
        {[0,1,2,3].map(i => <div key={i} className="h-16 bg-stone-100 rounded-sm" />)}
      </div>
      {[0,1,2].map(i => <div key={i} className="h-14 bg-stone-100 rounded-sm" />)}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────
interface Props { customerId: string; locale: string; }

export function CompromisosTab({ customerId, locale }: Props) {
  const t = useTranslations('dashboard.customers.appointments');
  useLocale(); // ensures locale context is available
  const [data,    setData]    = useState<AppointmentHistoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [errMsg,  setErrMsg]  = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await getCustomerAppointmentsAction(customerId);
      if (cancelled) return;
      setLoading(false);
      if (res.error) { setErrMsg(res.error.message); return; }
      setData(res.data!);
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  if (loading) return <Skeleton />;
  if (errMsg)  return <p className="font-sans text-sm text-rose-500 py-4 text-center">{errMsg}</p>;
  if (!data)   return null;

  const { stats, items } = data;

  const statusLabels: Record<string, string> = {
    pending:   t('status.pending'),
    confirmed: t('status.confirmed'),
    completed: t('status.completed'),
    cancelled: t('status.cancelled'),
    no_show:   t('status.no_show'),
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={stats.totalThisYear}         label={t('yearLabel')}      hint={t('yearHint')}      />
        <StatCard value={stats.cancelledCount}        label={t('cancelledLabel')} hint={t('cancelledHint')} />
        <StatCard value={fmtEur(stats.avgSpendCents)} label={t('avgSpendLabel')}  hint={t('avgSpendHint')}  />
        <StatCard value={stats.distinctServices}      label={t('servicesLabel')}  hint={t('servicesHint')}  />
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <CalendarX size={28} strokeWidth={1} />
          <p className="font-sans text-sm">{t('noHistory')}</p>
        </div>
      ) : (
        <div>{items.map(item => <ApptRow key={item.id} item={item} locale={locale} statusLabels={statusLabels} />)}</div>
      )}
    </div>
  );
}
