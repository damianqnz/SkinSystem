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
  organizationId:  string;
  date:            Date;
  locale:          string;
  staffProfileId?: string;
}

// ── Server Component ──────────────────────────────────────────

/**
 * WeekViewEngine — async Server Component.
 *
 * Fetches 7 × DayViewData in parallel via getWeekView, serialises Dates → ISO
 * strings, then hands off to the client orchestrator <WeekViewGrid>.
 *
 * Tenant isolation: getDayView (inside getWeekView) filters by organizationId
 * on every query.
 */
export async function WeekViewEngine({ organizationId, date, locale, staffProfileId }: WeekViewEngineProps) {
  const monday = getMonday(date);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  const res = await getWeekView(organizationId, date, staffProfileId);

  if (res.error || !res.data) {
    return (
      <div className="flex items-center justify-center py-16 px-4 text-center">
        <p className="text-sm text-red-400">
          {res.error?.message ?? 'Error al cargar la semana'}
        </p>
      </div>
    );
  }

  const weekDays: WeekDaySer[] = res.data.map((dv, i) => {
    const d = days[i]!;
    return {
      dateIso:       d.toISOString().slice(0, 10),
      businessStart: dv.businessStart,
      businessEnd:   dv.businessEnd,
      isOpen:        dv.isOpen,
      appointments:  dv.appointments.map(a => ({
        id:           a.id,
        startAt:      a.startAt.toISOString(),
        endAt:        a.endAt.toISOString(),
        status:       a.status,
        customerName: a.customerName,
        serviceName:  a.serviceName,
      })),
      blockedIntervals: dv.blockedIntervals.map(b => ({
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
