import { Suspense } from 'react';
import { headers }  from 'next/headers';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getMonthStart }         from '@/domains/booking/calendar-service';

import { CalendarHeader }     from './_components/CalendarHeader';
import { MonthEvents }        from './_components/MonthEvents';
import { AgendaSkeleton }     from './_components/AgendaSkeleton';
import { CalendarDayNav }     from './_components/CalendarDayNav';
import { AvailabilityEngine } from './_components/AvailabilityEngine';
import { WeekViewEngine }     from './_components/WeekViewEngine';
import { CalendarSkeleton }   from './_components/CalendarSkeleton';
import type { CalendarView }  from './_components/ViewSwitcher';

interface CalendarPageProps {
  searchParams: Promise<{
    month?: string;
    date?:  string;
    view?:  string;
  }>;
}

const VALID_VIEWS: CalendarView[] = ['day', 'week', 'month', 'team'];

/**
 * /dashboard/calendar — unified management calendar.
 */
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'pt';
  const t      = await getTranslations({ locale, namespace: 'dashboard.calendar' });

  const { month: monthParam, date: dateParam, view: viewParam } = await searchParams;

  const orgRes = await getOrganizationBySlug(slug);
  if (orgRes.error || !orgRes.data) notFound();
  const org = orgRes.data;

  const view: CalendarView = (VALID_VIEWS as string[]).includes(viewParam ?? '')
    ? (viewParam as CalendarView)
    : 'month';

  // ── Month / Team view ─────────────────────────────────────────
  if (view === 'month' || view === 'team') {
    const anchor     = monthParam ? new Date(monthParam + 'T00:00:00Z') : new Date();
    const monthStart = getMonthStart(anchor);

    return (
      <>
        <CalendarHeader monthStart={monthStart} locale={locale} view={view} />
        {view === 'month' ? (
          <Suspense
            key={`${monthStart.toISOString()}-month`}
            fallback={<AgendaSkeleton />}
          >
            <MonthEvents organizationId={org.id} anchorDate={monthStart} locale={locale} />
          </Suspense>
        ) : (
          <ComingSoon label={t('teamLabel')} copy={t('comingSoon', { label: t('teamLabel') })} />
        )}
      </>
    );
  }

  // ── Day / Week view ───────────────────────────────────────────
  const anchorDate = dateParam
    ? new Date(dateParam + 'T00:00:00Z')
    : (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; })();

  return (
    <div className="flex flex-col h-full min-h-0">
      <CalendarDayNav date={anchorDate} locale={locale} view={view} />
      <Suspense key={`${anchorDate.toISOString()}-${view}`} fallback={<CalendarSkeleton />}>
        {view === 'week' ? (
          <WeekViewEngine organizationId={org.id} date={anchorDate} locale={locale} />
        ) : (
          <AvailabilityEngine organizationId={org.id} date={anchorDate} locale={locale} />
        )}
      </Suspense>
    </div>
  );
}

function ComingSoon({ label, copy }: { label: string; copy: string }) {
  return (
    <div className="flex-1 flex items-center justify-center bg-(--color-spa-bg)">
      <div className="text-center space-y-2 max-w-xs">
        <p className="text-2xl font-light text-(--color-spa-stone)" style={{ fontFamily: 'var(--font-serif)' }}>
          {label}
        </p>
        <p className="text-[12px] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          {copy}
        </p>
      </div>
    </div>
  );
}
