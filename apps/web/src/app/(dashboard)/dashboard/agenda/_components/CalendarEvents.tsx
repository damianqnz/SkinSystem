import { getCalendarWeek, getWeekStart } from '@/domains/booking/calendar-service';
import { WeekGrid } from './WeekGrid';
import { AgendaList } from './AgendaList';

interface CalendarEventsProps {
  organizationId: string;
  anchorDate:     Date;
  locale:         string;
}

/**
 * CalendarEvents — async Server Component.
 * Fetches the week's appointments and renders both WeekGrid (desktop)
 * and AgendaList (mobile). Wrapped in Suspense by the parent page.
 */
export async function CalendarEvents({
  organizationId,
  anchorDate,
  locale,
}: CalendarEventsProps) {
  const result = await getCalendarWeek(organizationId, anchorDate);

  if (result.error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-red-500">{result.error.message}</p>
      </div>
    );
  }

  const { events, weekStart } = result.data;

  // Serialize Dates to ISO strings before passing to Client Components
  const serializedEvents = events.map((ev) => ({
    ...ev,
    startAt: ev.startAt instanceof Date ? ev.startAt : new Date(ev.startAt),
    endAt:   ev.endAt   instanceof Date ? ev.endAt   : new Date(ev.endAt),
  }));

  return (
    <>
      <WeekGrid
        events={serializedEvents}
        weekStart={weekStart}
        locale={locale}
      />
      <AgendaList
        events={serializedEvents}
        weekStart={weekStart}
        locale={locale}
      />
    </>
  );
}
