/**
 * Dashboard Panel — /dashboard
 *
 * Server Component. Reads tenant from x-tenant-slug header (injected by middleware).
 * Stats are fetched in parallel; appointments stream via <Suspense>.
 */

import { Suspense } from 'react';
import { headers } from 'next/headers';
import { CalendarDays, CalendarClock, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getSlotsByDate }         from '@/domains/booking/service';
import { getCustomersList }       from '@/domains/customers/service';

import { StatsCard }            from './_components/StatsCard';
import { AppointmentsList }     from './_components/AppointmentsList';
import { AppointmentsSkeleton } from './_components/AppointmentsSkeleton';
import { MockDataButton }       from './_components/MockDataButton';

// ── Helpers ───────────────────────────────────────────────────

const SECTION_HEADING = 'font-light text-(--color-spa-stone) tracking-wide';
const SECTION_META    = 'text-[11px] uppercase tracking-[0.16em] text-spa-muted';

const DAY_MS  = 24 * 60 * 60 * 1000;
const WEEK_MS = 7  * DAY_MS;

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

// ── Page ──────────────────────────────────────────────────────

export default async function DashboardPage() {
  const headersList = await headers();
  const slug   = headersList.get('x-tenant-slug') ?? '';
  const locale = headersList.get('x-locale') ?? 'pt';

  const t = await getTranslations({ locale, namespace: 'dashboard.home' });

  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) {
    return (
      <p className="text-sm text-spa-muted p-6" style={{ fontFamily: 'var(--font-sans)' }}>
        {t('orgNotFound', { slug })}
      </p>
    );
  }
  const orgId = orgResult.data.id;

  const today    = new Date();
  const tomorrow = new Date(today.getTime() + DAY_MS);

  const [todaySlotsRes, tomorrowSlotsRes, customersRes] = await Promise.all([
    getSlotsByDate(orgId, today),
    getSlotsByDate(orgId, tomorrow),
    getCustomersList(orgId),
  ]);

  const isActive = (s: string) => s === 'pending' || s === 'confirmed';
  const todayCount    = (todaySlotsRes.data    ?? []).filter(a => isActive(a.status)).length;
  const tomorrowCount = (tomorrowSlotsRes.data ?? []).filter(a => isActive(a.status)).length;

  const weekAgo         = new Date(Date.now() - WEEK_MS);
  const newClientsCount = (customersRes.data ?? []).filter(
    (c) => new Date(c.createdAt) >= weekAgo,
  ).length;

  const dateTag   = INTL_LOCALE_MAP[locale] ?? 'pt-PT';
  const dateLabel = today.toLocaleDateString(dateTag, { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-10 max-w-6xl mx-auto">
      {/* ── Page heading ─────────────────────────────────── */}
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className={SECTION_META} style={{ fontFamily: 'var(--font-sans)' }}>{dateLabel}</p>
          <h1
            className={`${SECTION_HEADING} text-3xl`}
            style={{ fontFamily: 'var(--font-serif)' }}
          >
            {t('panel')}
          </h1>
        </div>
        <MockDataButton />
      </div>

      {/* ── Stats bento ──────────────────────────────────── */}
      <section aria-label={t('metrics')}>
        <p className={`${SECTION_META} mb-4`} style={{ fontFamily: 'var(--font-sans)' }}>
          {t('metrics')}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            label={t('today')}
            value={todayCount}
            icon={<CalendarDays size={20} strokeWidth={1.5} />}
          />
          <StatsCard
            label={t('tomorrow')}
            value={tomorrowCount}
            icon={<CalendarClock size={20} strokeWidth={1.5} />}
          />
          <StatsCard
            label={t('newClients')}
            value={newClientsCount}
            icon={<Users size={20} strokeWidth={1.5} />}
          />
        </div>
      </section>

      {/* ── Upcoming appointments ─────────────────────────── */}
      <section aria-label={t('appointments')}>
        <p className={`${SECTION_META} mb-1`} style={{ fontFamily: 'var(--font-sans)' }}>
          {t('upcoming')}
        </p>
        <h2
          className={`${SECTION_HEADING} text-2xl mb-5`}
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {t('appointments')}
        </h2>

        <Suspense fallback={<AppointmentsSkeleton />}>
          <AppointmentsList organizationId={orgId} locale={locale} limit={20} />
        </Suspense>
      </section>
    </div>
  );
}
