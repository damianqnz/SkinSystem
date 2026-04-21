'use client';

import { useState, useEffect } from 'react';
import { CalendarX } from 'lucide-react';
import { getCustomerAppointmentsAction } from '../../actions/get-customer-appointments';
import type { AppointmentHistoryData, AppointmentHistoryItem } from '@/domains/customers/service-appointments';

// ── Helpers ──────────────────────────────────────────────────────
function svcName(name: Record<string, string> | null, locale: string): string {
  if (!name) return '—';
  return name[locale] ?? name['es'] ?? Object.values(name)[0] ?? '—';
}

function fmtEur(cents: number | null): string {
  if (cents == null) return '—';
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

function fmtAppt(iso: string, locale: string) {
  const d = new Date(iso);
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  return {
    date: d.toLocaleDateString(tag, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' }),
  };
}

const STATUS_CLS: Record<string, string> = {
  pending:   'bg-amber-50  text-amber-700  border-amber-200',
  confirmed: 'bg-sky-50    text-sky-700    border-sky-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-stone-50  text-stone-500  border-stone-200',
  no_show:   'bg-rose-50   text-rose-600   border-rose-200',
};
const STATUS_L: Record<string, Record<string, string>> = {
  pending:   { es: 'Pendiente',  pt: 'Pendente',  en: 'Pending'   },
  confirmed: { es: 'Confirmada', pt: 'Confirmada', en: 'Confirmed' },
  completed: { es: 'Completada', pt: 'Concluída',  en: 'Completed' },
  cancelled: { es: 'Cancelada',  pt: 'Cancelada',  en: 'Cancelled' },
  no_show:   { es: 'No asistió', pt: 'Faltou',     en: 'No-show'  },
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

function ApptRow({ item, locale }: { item: AppointmentHistoryItem; locale: string }) {
  const { date, time } = fmtAppt(item.startAt, locale);
  const statusCls   = STATUS_CLS[item.status] ?? STATUS_CLS.pending!;
  const statusLabel = (STATUS_L[item.status] ?? STATUS_L.pending!)[locale] ?? STATUS_L.pending!.es!;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-stone-100 last:border-0">
      {/* Date / time */}
      <div className="w-32 shrink-0">
        <p className="font-sans text-xs text-stone-700 leading-snug">{date}</p>
        <p className="font-sans text-[11px] text-stone-400">{time}</p>
      </div>
      {/* Service + staff */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm text-stone-800 truncate">{svcName(item.serviceName, locale)}</p>
        {item.staffName && <p className="font-sans text-[11px] text-stone-400 truncate">{item.staffName}</p>}
      </div>
      {/* Status + price */}
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
  const L = {
    year:        locale === 'pt' ? 'Este ano'    : locale === 'en' ? 'This year'   : 'Este año',
    yearHint:    locale === 'pt' ? 'Visitas concluídas no ano em curso'
                 : locale === 'en' ? 'Completed visits in the current year'
                 : 'Visitas completadas en el año en curso',
    cancel:      locale === 'pt' ? 'Canceladas'  : locale === 'en' ? 'Cancelled'   : 'Canceladas',
    cancelHint:  locale === 'pt' ? 'Total de consultas que não se realizaram'
                 : locale === 'en' ? 'Appointments that did not take place'
                 : 'Total de citas que no se llevaron a cabo',
    avg:         locale === 'pt' ? 'Gasto médio' : locale === 'en' ? 'Avg. spend'  : 'Gasto medio',
    avgHint:     locale === 'pt' ? 'Média por sessão concluída'
                 : locale === 'en' ? 'Average amount per completed session'
                 : 'Promedio por sesión completada',
    services:    locale === 'pt' ? 'Serviços'    : locale === 'en' ? 'Services'    : 'Servicios',
    servicesHint:locale === 'pt' ? 'Tratamentos distintos já realizados'
                 : locale === 'en' ? 'Distinct treatments received'
                 : 'Tipos de tratamiento distintos recibidos',
    noCitas:     locale === 'pt' ? 'Sem historial de visitas.' : locale === 'en' ? 'No visits yet.' : 'Sin historial de visitas.',
  };

  return (
    <div className="space-y-5">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard value={stats.totalThisYear}         label={L.year}     hint={L.yearHint}     />
        <StatCard value={stats.cancelledCount}        label={L.cancel}   hint={L.cancelHint}   />
        <StatCard value={fmtEur(stats.avgSpendCents)} label={L.avg}      hint={L.avgHint}      />
        <StatCard value={stats.distinctServices}      label={L.services} hint={L.servicesHint} />
      </div>

      {/* Appointment list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-8 text-stone-400">
          <CalendarX size={28} strokeWidth={1} />
          <p className="font-sans text-sm">{L.noCitas}</p>
        </div>
      ) : (
        <div>{items.map(item => <ApptRow key={item.id} item={item} locale={locale} />)}</div>
      )}
    </div>
  );
}
