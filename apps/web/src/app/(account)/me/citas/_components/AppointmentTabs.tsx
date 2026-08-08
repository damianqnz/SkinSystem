'use client';

import { useState }  from 'react';
import Link          from 'next/link';
import { Calendar, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import type { MeAppointment } from '@/domains/customers/service-me';

// ── Helpers ───────────────────────────────────────────────────

function t(nameI18n: unknown, locale: string): string {
  if (!nameI18n || typeof nameI18n !== 'object') return 'Servicio';
  const o = nameI18n as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? 'Servicio';
}

function fmtDate(date: Date, locale: string): string {
  return new Date(date).toLocaleDateString(
    locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES',
    { weekday: 'long', day: 'numeric', month: 'long' },
  );
}

function fmtTime(date: Date, locale: string): string {
  return new Date(date).toLocaleTimeString(
    locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES',
    { hour: '2-digit', minute: '2-digit' },
  );
}

function fmtPrice(cents: number, currency = 'EUR'): string {
  return (cents / 100).toLocaleString('es-ES', {
    style: 'currency', currency,
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

// ── Status badge ──────────────────────────────────────────────

type StatusCfg = { label: string; color: string; icon: React.ReactNode };

const STATUS_CONFIG: Record<string, StatusCfg> = {
  confirmed: { label: 'Confirmada', color: 'text-emerald-700 bg-emerald-50 border-emerald-100', icon: <CheckCircle2 size={12} /> },
  pending:   { label: 'Pendiente',  color: 'text-amber-700 bg-amber-50 border-amber-100',       icon: <Clock size={12} /> },
  completed: { label: 'Completada', color: 'text-stone-500 bg-stone-50 border-stone-200',       icon: <CheckCircle2 size={12} /> },
  cancelled: { label: 'Cancelada',  color: 'text-red-600 bg-red-50 border-red-100',             icon: <XCircle size={12} /> },
  no_show:   { label: 'No asistió', color: 'text-rose-600 bg-rose-50 border-rose-100',          icon: <AlertCircle size={12} /> },
};
const DEFAULT_STATUS: StatusCfg = STATUS_CONFIG['pending']!;

// ── Appointment card ──────────────────────────────────────────

function AppointmentCard({ appt, locale }: { appt: MeAppointment; locale: string }) {
  const cfg = STATUS_CONFIG[appt.status] ?? DEFAULT_STATUS;

  return (
    <div className="rounded-xl border border-stone-100 bg-white p-4 space-y-3 hover:border-stone-200 transition-colors">

      {/* Service row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="w-1.5 h-8 rounded-full flex-shrink-0"
            style={{ backgroundColor: appt.serviceColor ?? '#D4AF37' }}
          />
          <div className="min-w-0">
            <p className="font-cormorant text-[15px] font-semibold text-stone-900 leading-snug truncate">
              {t(appt.serviceNameI18n, locale)}
            </p>
            <p className="text-xs text-stone-400 mt-0.5 font-outfit">{appt.durationMinutes} min</p>
          </div>
        </div>
        <span className={`flex items-center gap-1 px-2.5 py-0.5 text-[10px] font-outfit font-medium rounded-full border flex-shrink-0 ${cfg.color}`}>
          {cfg.icon}
          {cfg.label}
        </span>
      </div>

      {/* Date */}
      <div className="flex items-center gap-2 text-xs text-stone-500 font-outfit">
        <Calendar size={12} className="text-stone-300" />
        <span className="capitalize">{fmtDate(appt.startAt, locale)}</span>
        <span className="text-stone-200">·</span>
        <span>{fmtTime(appt.startAt, locale)}</span>
      </div>

      {/* Price */}
      <div className="flex items-center justify-between border-t border-stone-50 pt-2.5">
        <span className="text-xs text-stone-400 font-outfit">Total</span>
        <span className="text-xs font-outfit font-semibold text-stone-800 tabular-nums">
          {fmtPrice(appt.totalCents, appt.currency)}
          {appt.discountCents > 0 && (
            <span className="ml-1.5 text-emerald-600">
              (−{fmtPrice(appt.discountCents, appt.currency)})
            </span>
          )}
        </span>
      </div>
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────

function EmptyUpcoming() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-4">
      <Calendar size={32} className="text-stone-200" />
      <div className="text-center">
        <p className="font-outfit text-sm font-medium text-stone-500">Sin reservas futuras</p>
        <p className="text-xs text-stone-400 mt-1">¿Repetimos la experiencia?</p>
      </div>
      <Link
        href="/book"
        className="mt-1 px-5 py-2.5 text-xs font-outfit font-semibold rounded-xl transition-opacity hover:opacity-90"
        style={{ backgroundColor: 'var(--brand-color)', color: '#1c1917' }}
      >
        Hacer una reserva
      </Link>
    </div>
  );
}

function EmptyPast() {
  return (
    <div className="flex flex-col items-center justify-center py-14 gap-3">
      <Calendar size={32} className="text-stone-200" />
      <p className="font-outfit text-sm text-stone-400 text-center">
        Aún no tienes citas pasadas
      </p>
    </div>
  );
}

// ── Main tab component ────────────────────────────────────────

interface AppointmentTabsProps {
  upcoming: MeAppointment[];
  past:     MeAppointment[];
  locale:   string;
}

export function AppointmentTabs({ upcoming, past, locale }: AppointmentTabsProps) {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-cormorant text-xl font-semibold text-stone-900">
          Mis citas
        </h2>
        {/* Tab pills */}
        <div className="flex items-center gap-1 bg-stone-100 rounded-full p-1">
          <button
            type="button"
            onClick={() => setTab('upcoming')}
            className={[
              'px-4 py-1.5 text-xs font-outfit font-medium rounded-full transition-all',
              tab === 'upcoming'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800',
            ].join(' ')}
          >
            Próximas
            {upcoming.length > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${tab === 'upcoming' ? 'bg-white/20' : 'bg-stone-200 text-stone-600'}`}>
                {upcoming.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setTab('past')}
            className={[
              'px-4 py-1.5 text-xs font-outfit font-medium rounded-full transition-all',
              tab === 'past'
                ? 'bg-stone-900 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-800',
            ].join(' ')}
          >
            Pasadas
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'upcoming' ? (
        upcoming.length === 0
          ? <EmptyUpcoming />
          : <div className="space-y-3">
              {upcoming.map((a) => <AppointmentCard key={a.id} appt={a} locale={locale} />)}
            </div>
      ) : (
        past.length === 0
          ? <EmptyPast />
          : <div className="space-y-3">
              {past.map((a) => <AppointmentCard key={a.id} appt={a} locale={locale} />)}
            </div>
      )}
    </div>
  );
}
