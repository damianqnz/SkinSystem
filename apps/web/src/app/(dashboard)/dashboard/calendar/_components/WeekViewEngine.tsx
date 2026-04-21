import { getWeekView } from '@/domains/booking/week-view-service';
import { WeekViewGrid } from './WeekViewGrid';
import type { WeekDaySer } from './week-utils';

// ── Helpers ───────────────────────────────────────────────────

function getMonday(d: Date): Date {
  const monday = new Date(d);
  const dow = monday.getUTCDay();
  monday.setUTCDate(monday.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  monday.setUTCHours(0, 0, 0, 0);
  return monday;
}

// ── Props ─────────────────────────────────────────────────────

interface WeekViewEngineProps {
  organizationId: string;
  date:           Date;
  locale:         string;
}

// ── Server Component ──────────────────────────────────────────

/**
 * WeekViewEngine — async Server Component.
 *
 * Fetches 7 × DayViewData in parallel, serialises Dates → ISO strings,
 * then hands off to the client orchestrator <WeekViewGrid>.
 *
 * Tenant isolation: getDayView filters by organizationId on every query.
 */
export async function WeekViewEngine({ organizationId, date, locale }: WeekViewEngineProps) {
  const monday = getMonday(date);
  const result = await getWeekView(organizationId, monday);

  if (result.error || !result.data) {
    return (
      <div className="flex items-center justify-center py-16 px-4 text-center">
        <p className="text-sm text-red-400">
          {result.error?.message ?? 'Error al cargar la semana'}
        </p>
      </div>
    );
  }

  const weekDays: WeekDaySer[] = result.data.map((day, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return {
      dateIso:       d.toISOString().slice(0, 10),
      businessStart: day.businessStart,
      businessEnd:   day.businessEnd,
      isOpen:        day.isOpen,
      appointments:  day.appointments.map(a => ({
        id:           a.id,
        startAt:      a.startAt.toISOString(),
        endAt:        a.endAt.toISOString(),
        status:       a.status,
        customerName: a.customerName,
        serviceName:  a.serviceName,
      })),
      blockedIntervals: day.blockedIntervals.map(b => ({
        id:      b.id,
        startAt: b.startAt.toISOString(),
        endAt:   b.endAt.toISOString(),
        reason:  b.reason,
      })),
    };
  });

  return (
    <div className="flex flex-col min-h-0 h-full">
      <WeekViewGrid
        weekDays={weekDays}
        weekStartIso={monday.toISOString().slice(0, 10)}
        locale={locale}
      />
    </div>
  );
}
