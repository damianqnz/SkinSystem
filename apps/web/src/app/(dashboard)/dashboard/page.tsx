/**
 * Dashboard Overview — /dashboard
 *
 * Server Component. Reads tenant from x-tenant-slug header (injected by middleware).
 * Stats are fetched in parallel; appointments stream via <Suspense>.
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { CalendarDays, Users, Layers } from 'lucide-react';

import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getSlotsByDate }         from '@/domains/booking/service';
import { getCustomersList }       from '@/domains/customers/service';
import { getActiveServices }      from '@/domains/catalog/service';

import { StatsCard }            from './_components/StatsCard';
import { AppointmentsList }     from './_components/AppointmentsList';
import { AppointmentsSkeleton } from './_components/AppointmentsSkeleton';

// ── Helpers ───────────────────────────────────────────────────

const SECTION_HEADING = 'font-serif text-2xl font-light text-[var(--color-spa-stone)] tracking-wide';
const SECTION_META    = 'font-sans text-xs uppercase tracking-[0.16em] text-[var(--color-spa-muted)]';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

// ── Page ──────────────────────────────────────────────────────

export default async function DashboardPage() {
  const headersList = await headers();
  const slug   = headersList.get('x-tenant-slug') ?? '';
  const locale = headersList.get('x-locale') ?? 'es';

  // 1. Resolve slug → org UUID (required for all domain services)
  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) {
    return (
      <p className="font-sans text-sm text-[var(--color-spa-muted)] p-6">
        No se encontró la organización &quot;{slug}&quot;.
      </p>
    );
  }
  const orgId = orgResult.data.id;

  // 2. Fetch stats in parallel — fast queries, no waterfall
  const today = new Date();
  const [slotsRes, customersRes, servicesRes] = await Promise.all([
    getSlotsByDate(orgId, today),
    getCustomersList(orgId),
    getActiveServices(orgId),
  ]);

  const todayCount    = (slotsRes.data ?? []).filter((a) =>
    a.status === 'pending' || a.status === 'confirmed'
  ).length;

  const weekAgo         = new Date(Date.now() - WEEK_MS);
  const newClientsCount = (customersRes.data ?? []).filter(
    (c) => new Date(c.createdAt) >= weekAgo,
  ).length;

  const activeServicesCount = servicesRes.data?.length ?? 0;

  // 3. Localised date heading
  const dateTag   = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  const dateLabel = today.toLocaleDateString(dateTag, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-10">
      {/* ── Page heading ─────────────────────────────────── */}
      <div className="space-y-1">
        <p className={SECTION_META}>{dateLabel}</p>
        <h1 className={`${SECTION_HEADING} text-3xl`}>
          {locale === 'en' ? 'Overview' : locale === 'pt' ? 'Visão Geral' : 'Resumen'}
        </h1>
      </div>

      {/* ── Stats grid ───────────────────────────────────── */}
      <section aria-label="Métricas rápidas">
        <p className={`${SECTION_META} mb-4`}>
          {locale === 'en' ? 'Quick stats' : locale === 'pt' ? 'Métricas rápidas' : 'Métricas rápidas'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label={locale === 'en' ? 'Appointments today' : locale === 'pt' ? 'Consultas hoje' : 'Citas hoy'}
            value={todayCount}
            icon={<CalendarDays size={20} strokeWidth={1.5} />}
          />
          <StatsCard
            label={locale === 'en' ? 'New clients (7d)' : locale === 'pt' ? 'Novos clientes (7d)' : 'Clientes nuevos (7d)'}
            value={newClientsCount}
            icon={<Users size={20} strokeWidth={1.5} />}
          />
          <StatsCard
            label={locale === 'en' ? 'Active services' : locale === 'pt' ? 'Serviços ativos' : 'Servicios activos'}
            value={activeServicesCount}
            icon={<Layers size={20} strokeWidth={1.5} />}
          />
        </div>
      </section>

      {/* ── Upcoming appointments ─────────────────────────── */}
      <section aria-label="Próximas citas">
        <p className={`${SECTION_META} mb-1`}>
          {locale === 'en' ? 'Upcoming' : locale === 'pt' ? 'Próximas' : 'Próximas'}
        </p>
        <h2 className={`${SECTION_HEADING} mb-5`}>
          {locale === 'en' ? 'Appointments' : locale === 'pt' ? 'Consultas' : 'Citas'}
        </h2>

        {/* Suspense boundary — AppointmentsList streams while stats are already painted */}
        <Suspense fallback={<AppointmentsSkeleton />}>
          <AppointmentsList organizationId={orgId} locale={locale} limit={6} />
        </Suspense>
      </section>
    </div>
  );
}
