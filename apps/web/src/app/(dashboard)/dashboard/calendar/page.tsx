import { Suspense } from 'react';
import { headers }  from 'next/headers';
import { notFound } from 'next/navigation';

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
    /** First day of displayed month — used by month view */
    month?: string;
    /** Anchor date YYYY-MM-DD — used by day / week views */
    date?:  string;
    /** 'month' | 'week' | 'day' | 'team' — defaults to 'month' */
    view?:  string;
  }>;
}

const VALID_VIEWS: CalendarView[] = ['day', 'week', 'month', 'team'];

/**
 * /dashboard/calendar — unified management calendar.
 *
 * All views live in the same route; the ?view= param controls what renders:
 *   month  → CalendarHeader + MonthView grid
 *   week   → CalendarDayNav + WeekViewEngine (24h × 7 grid)
 *   day    → CalendarDayNav + AvailabilityEngine (24h grid)
 *   team   → Coming soon placeholder
 */
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

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
            <MonthEvents
              organizationId={org.id}
              anchorDate={monthStart}
              locale={locale}
            />
          </Suspense>
        ) : (
          <ComingSoon view={view} locale={locale} />
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
          <WeekViewEngine
            organizationId={org.id}
            date={anchorDate}
            locale={locale}
          />
        ) : (
          <AvailabilityEngine
            organizationId={org.id}
            date={anchorDate}
            locale={locale}
          />
        )}
      </Suspense>
    </div>
  );
}

// ── Coming-soon placeholder ───────────────────────────────────────
function ComingSoon({ view, locale }: { view: CalendarView; locale: string }) {
  const label =
    view === 'team'
      ? (locale === 'en' ? 'Team' : locale === 'pt' ? 'Equipa' : 'Equipo')
      : '';
  const copy =
    locale === 'pt' ? `A vista «${label}» chega em breve.` :
    locale === 'en' ? `The "${label}" view is coming soon.` :
                      `La vista «${label}» llega pronto.`;
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
