import { Suspense } from 'react';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';

import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getMonthStart } from '@/domains/booking/calendar-service';

import { CalendarHeader } from './_components/CalendarHeader';
import { MonthEvents }    from './_components/MonthEvents';
import { AgendaSkeleton } from './_components/AgendaSkeleton';
import type { CalendarView } from './_components/ViewSwitcher';

interface AgendaPageProps {
  searchParams: Promise<{ month?: string; view?: string }>;
}

const VALID_VIEWS: CalendarView[] = ['day', 'week', 'month', 'team'];

/**
 * /dashboard/agenda — management calendar (Setmore-style).
 *
 * PPR pattern:
 *   - Static shell: CalendarHeader (view dropdown + month nav)
 *   - Streamed:     MonthEvents   (DB query → MonthView client grid)
 *
 * URL search-params:
 *   ?month=YYYY-MM-DD  — first day of the displayed month (defaults to today)
 *   ?view=month|week|day|team  — defaults to 'month'
 */
export default async function AgendaPage({ searchParams }: AgendaPageProps) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

  const { month: monthParam, view: viewParam } = await searchParams;

  const orgRes = await getOrganizationBySlug(slug);
  if (orgRes.error || !orgRes.data) notFound();
  const org = orgRes.data;

  // Anchor date = first of the requested month (or today)
  const anchor    = monthParam ? new Date(monthParam + 'T00:00:00Z') : new Date();
  const monthStart = getMonthStart(anchor);

  const view: CalendarView = (VALID_VIEWS as string[]).includes(viewParam ?? '')
    ? (viewParam as CalendarView)
    : 'month';

  return (
    <>
      {/* Static header — instantly painted */}
      <CalendarHeader monthStart={monthStart} locale={locale} view={view} />

      {/* Streamed body */}
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

// ── Coming-soon placeholder for non-month views (Phase 2) ──────────

function ComingSoon({ view, locale }: { view: CalendarView; locale: string }) {
  const label = { day: 'Dia', week: 'Semana', team: 'Equipa' }[view as 'day' | 'week' | 'team'] ?? '';
  const copy =
    locale === 'pt' ? `A vista «${label}» chega em breve.` :
    locale === 'en' ? `The “${label}” view is coming soon.` :
                      `La vista «${label}» llega pronto.`;
  return (
    <div className="flex-1 flex items-center justify-center bg-(--color-spa-bg)">
      <div className="text-center space-y-2 max-w-xs">
        <p
          className="text-2xl font-light text-(--color-spa-stone)"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {label}
        </p>
        <p className="text-[12px] text-spa-muted" style={{ fontFamily: 'var(--font-sans)' }}>
          {copy}
        </p>
      </div>
    </div>
  );
}
