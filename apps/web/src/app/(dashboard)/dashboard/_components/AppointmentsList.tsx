/**
 * AppointmentsList — async Server Component.
 * Fetches upcoming appointments + resolves customer/service names in-flight.
 * Wrapped in <Suspense> by the parent page for streaming.
 */

import { getUpcomingAppointments } from '@/domains/booking/service';
import { getCustomersList } from '@/domains/customers/service';
import { getActiveServices } from '@/domains/catalog/service';
import { EmptyState } from './EmptyState';
import { Clock, User } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────

function resolveServiceName(nameI18n: unknown, locale: string): string {
  const map = nameI18n as Record<string, string> | null;
  return map?.[locale] ?? map?.['es'] ?? map?.['en'] ?? 'Servicio';
}

function formatTime(date: Date, locale: string): string {
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  return date.toLocaleTimeString(tag, { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date, locale: string): string {
  const now  = new Date();
  const tag  = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  const isToday = date.toDateString() === now.toDateString();
  const isTomorrow = date.toDateString() === new Date(Date.now() + 86_400_000).toDateString();
  if (isToday)    return locale === 'en' ? 'Today' : locale === 'pt' ? 'Hoje' : 'Hoy';
  if (isTomorrow) return locale === 'en' ? 'Tomorrow' : locale === 'pt' ? 'Amanhã' : 'Mañana';
  return date.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
}

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50  text-amber-700  border-amber-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const STATUS_LABEL: Record<string, Record<string, string>> = {
  pending:   { es: 'Pendiente', en: 'Pending', pt: 'Pendente' },
  confirmed: { es: 'Confirmada', en: 'Confirmed', pt: 'Confirmada' },
};

// ── Component ─────────────────────────────────────────────────

interface Props {
  organizationId: string;
  locale: string;
  limit?: number;
}

export async function AppointmentsList({ organizationId, locale, limit = 6 }: Props) {
  const [apptRes, custRes, svcRes] = await Promise.all([
    getUpcomingAppointments(organizationId),
    getCustomersList(organizationId),
    getActiveServices(organizationId),
  ]);

  const appointments = apptRes.data?.slice(0, limit) ?? [];

  if (appointments.length === 0) return <EmptyState />;

  const custMap = new Map((custRes.data ?? []).map((c) => [c.id, c.fullName]));
  const svcMap  = new Map((svcRes.data ?? []).map((s) => [s.id, s.nameI18n]));

  return (
    <ul className="space-y-2">
      {appointments.map((appt) => {
        const customerName  = custMap.get(appt.customerId) ?? '—';
        const serviceNameI18n = svcMap.get(appt.serviceId);
        const serviceName   = resolveServiceName(serviceNameI18n, locale);
        const statusStyle   = STATUS_STYLES[appt.status] ?? 'bg-stone-50 text-stone-500 border-stone-200';
        const statusLabel   = STATUS_LABEL[appt.status]?.[locale] ?? appt.status;

        return (
          <li
            key={appt.id}
            className="flex items-center gap-4 px-5 py-4 rounded-sm border border-[var(--color-spa-border)] bg-white/50 backdrop-blur-sm hover:bg-white/80 transition-colors duration-150 group"
          >
            {/* Time block */}
            <div className="flex-shrink-0 w-11 text-center">
              <p className="font-sans text-[11px] uppercase tracking-wider text-[var(--color-spa-muted)]">
                {formatDate(appt.startAt, locale)}
              </p>
              <p className="font-sans text-base font-medium text-[var(--color-spa-stone)] tabular-nums leading-tight">
                {formatTime(appt.startAt, locale)}
              </p>
            </div>

            {/* Divider */}
            <div className="w-px h-8 bg-[var(--color-spa-border)] flex-shrink-0" />

            {/* Customer + service */}
            <div className="flex-1 min-w-0">
              <p className="font-sans text-sm font-medium text-[var(--color-spa-stone)] truncate flex items-center gap-1.5">
                <User size={11} strokeWidth={1.5} className="text-[var(--color-spa-muted)] flex-shrink-0" />
                {customerName}
              </p>
              <p className="font-sans text-xs text-[var(--color-spa-muted)] truncate flex items-center gap-1.5 mt-0.5">
                <Clock size={11} strokeWidth={1.5} className="flex-shrink-0" />
                {serviceName}
              </p>
            </div>

            {/* Status badge */}
            <span className={`hidden sm:inline-flex font-sans text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border flex-shrink-0 ${statusStyle}`}>
              {statusLabel}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
