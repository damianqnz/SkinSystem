/**
 * AppointmentsList — async Server Component.
 * Fetches upcoming appointments + resolves customer/service names in-flight.
 * Wrapped in <Suspense> by the parent page for streaming.
 *
 * Layout: vertical list of cards. Internal scroll when items > 5.
 */

import { getUpcomingAppointments } from '@/domains/booking/service';
import { getCustomersList } from '@/domains/customers/service';
import { getActiveServices } from '@/domains/catalog/service';
import { getTranslations } from 'next-intl/server';
import { EmptyState } from './EmptyState';
import { Clock, User } from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

const STATUS_STYLES: Record<string, string> = {
  pending:   'bg-amber-50    text-amber-700    border-amber-200',
  confirmed: 'bg-emerald-50  text-emerald-700  border-emerald-200',
  cancelled: 'bg-stone-50    text-stone-500    border-stone-200',
};

// ── Component ─────────────────────────────────────────────────

interface Props {
  organizationId: string;
  locale: string;
  limit?: number;
}

export async function AppointmentsList({ organizationId, locale, limit = 20 }: Props) {
  const t          = await getTranslations({ locale, namespace: 'dashboard.home.appointments_list' });
  const intlLocale = INTL_LOCALE_MAP[locale] ?? 'pt-PT';

  function resolveServiceName(nameI18n: unknown): string {
    const map = nameI18n as Record<string, string> | null;
    return map?.[locale] ?? map?.['es'] ?? map?.['en'] ?? t('serviceFallback');
  }

  function formatTime(date: Date): string {
    return date.toLocaleTimeString(intlLocale, { hour: '2-digit', minute: '2-digit' });
  }

  function formatDate(date: Date): string {
    const now  = new Date();
    const isToday    = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === new Date(Date.now() + 86_400_000).toDateString();
    if (isToday)    return t('today');
    if (isTomorrow) return t('tomorrow');
    return date.toLocaleDateString(intlLocale, { day: 'numeric', month: 'short' });
  }

  const STATUS_LABEL: Record<string, string> = {
    pending:   t('statusPending'),
    confirmed: t('statusConfirmed'),
    cancelled: t('statusCancelled'),
  };

  const [apptRes, custRes, svcRes] = await Promise.all([
    getUpcomingAppointments(organizationId),
    getCustomersList(organizationId),
    getActiveServices(organizationId),
  ]);

  const appointments = apptRes.data?.slice(0, limit) ?? [];
  if (appointments.length === 0) return <EmptyState />;

  const custMap = new Map((custRes.data ?? []).map((c) => [c.id, c.fullName]));
  const svcMap  = new Map((svcRes.data  ?? []).map((s) => [s.id, s.nameI18n]));

  return (
    <div
      className="rounded-md border border-spa-border bg-white overflow-hidden"
      role="region"
      aria-label={t('ariaList')}
    >
      <ul className="max-h-[420px] overflow-y-auto divide-y divide-spa-border no-scrollbar">
        {appointments.map((appt) => {
          const customerName    = custMap.get(appt.customerId) ?? '—';
          const serviceNameI18n = svcMap.get(appt.serviceId);
          const serviceName     = resolveServiceName(serviceNameI18n);
          const statusStyle     = STATUS_STYLES[appt.status] ?? STATUS_STYLES.cancelled!;
          const statusLabel     = STATUS_LABEL[appt.status] ?? appt.status;

          return (
            <li
              key={appt.id}
              className="flex items-center gap-4 px-5 py-3.5 hover:bg-stone-50/60 transition-colors duration-150"
            >
              {/* Time block */}
              <div className="shrink-0 w-12 text-center">
                <p className="text-[10px] uppercase tracking-wider text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
                  {formatDate(appt.startAt)}
                </p>
                <p className="text-base font-medium text-(--color-spa-stone) tabular-nums leading-tight mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                  {formatTime(appt.startAt)}
                </p>
              </div>

              {/* Divider */}
              <div className="w-px h-9 bg-spa-border shrink-0" />

              {/* Customer + service */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-(--color-spa-stone) truncate flex items-center gap-1.5" style={{ fontFamily: 'var(--font-sans)' }}>
                  <User size={11} strokeWidth={1.5} className="text-spa-muted shrink-0" />
                  {customerName}
                </p>
                <p className="text-xs text-spa-muted truncate flex items-center gap-1.5 mt-0.5" style={{ fontFamily: 'var(--font-sans)' }}>
                  <Clock size={11} strokeWidth={1.5} className="shrink-0" />
                  {serviceName}
                </p>
              </div>

              {/* Service badge */}
              <span
                className="hidden md:inline-flex max-w-[160px] truncate text-[11px] tracking-wide
                           px-2.5 py-1 rounded-full border border-[#D4AF37]/30
                           bg-[rgba(212,175,55,0.06)] text-(--color-spa-stone) shrink-0"
                style={{ fontFamily: 'var(--font-sans)' }}
                title={serviceName}
              >
                {serviceName}
              </span>

              {/* Status badge */}
              <span
                className={`hidden sm:inline-flex text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border shrink-0 ${statusStyle}`}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {statusLabel}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
