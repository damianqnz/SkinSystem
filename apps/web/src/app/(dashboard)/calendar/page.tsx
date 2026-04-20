import { Suspense }    from 'react';
import { headers }     from 'next/headers';
import { notFound }    from 'next/navigation';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { CalendarDayNav }        from './_components/CalendarDayNav';
import { AvailabilityEngine }    from './_components/AvailabilityEngine';
import { CalendarSkeleton }      from './_components/CalendarSkeleton';
import { WeekViewEngine }        from './_components/WeekViewEngine';
import type { CalendarView }     from '../dashboard/agenda/_components/ViewSwitcher';

interface CalendarPageProps {
  searchParams: Promise<{
    date?: string;  // "YYYY-MM-DD" — defaults to today
    view?: string;  // "day" | "week"
  }>;
}

/**
 * /calendar — Visual Day / Week Calendar
 *
 * Day view:  24h grid via AvailabilityEngine → getDayView.
 * Week view: 24h grid × 7 via WeekViewEngine → getWeekView (getDayView × 7).
 *
 * Tenant isolation: organization_id injected by middleware via x-tenant-slug.
 */
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

  const { date: dateParam, view: viewParam } = await searchParams;

  // ── Resolve organization ──────────────────────────────────
  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  // ── Resolve anchor date ───────────────────────────────────
  const anchorDate = dateParam
    ? new Date(dateParam + 'T00:00:00Z')
    : (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; })();

  const view: CalendarView = viewParam === 'week' ? 'week' : 'day';

  return (
    <div className="flex flex-col h-full min-h-0">
      <CalendarDayNav date={anchorDate} locale={locale} view={view} />

      <Suspense key={`${anchorDate.toISOString()}-${view}`} fallback={<CalendarSkeleton />}>
        {view === 'day' ? (
          <AvailabilityEngine
            organizationId={org.id}
            date={anchorDate}
            locale={locale}
          />
        ) : (
          <WeekViewEngine
            organizationId={org.id}
            date={anchorDate}
            locale={locale}
          />
        )}
      </Suspense>
    </div>
  );
}
