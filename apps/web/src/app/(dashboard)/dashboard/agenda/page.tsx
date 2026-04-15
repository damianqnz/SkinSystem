import { Suspense } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getWeekStart } from '@/domains/booking/calendar-service';
import { CalendarHeader } from './_components/CalendarHeader';
import { CalendarEvents } from './_components/CalendarEvents';
import { CalendarSkeleton } from './_components/CalendarSkeleton';

interface AgendaPageProps {
  searchParams: Promise<{ week?: string }>;
}

/**
 * /dashboard/agenda — Calendar Management page.
 *
 * PPR pattern:
 *   - Static shell: CalendarHeader (week nav, day labels)
 *   - Streamed:     CalendarEvents (appointments from DB)
 *
 * `?week=2026-04-14` (ISO date) controls which week to display.
 * Defaults to current week when absent.
 */
export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const hdrs        = await headers();
  const slug        = hdrs.get('x-tenant-slug') ?? '';
  const locale      = hdrs.get('x-locale') ?? 'es';

  const { week: weekParam } = await searchParams;

  // Resolve organization
  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  // Determine anchor date
  const anchorDate = weekParam
    ? new Date(weekParam + 'T00:00:00Z')
    : new Date();

  const weekStart = getWeekStart(anchorDate);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* ── Static shell: Calendar Header ──── */}
      <CalendarHeader
        weekStart={weekStart}
        locale={locale}
      />

      {/* ── Streamed: Calendar Events ─────── */}
      <Suspense fallback={<CalendarSkeleton />}>
        <CalendarEvents
          organizationId={org.id}
          anchorDate={anchorDate}
          locale={locale}
        />
      </Suspense>
    </div>
  );
}
