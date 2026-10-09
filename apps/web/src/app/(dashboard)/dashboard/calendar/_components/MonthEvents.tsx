/**
 * MonthEvents — async Server Component.
 *
 * Fetches month events + blocked intervals in parallel, serialises Dates → ISO
 * and hands off to the client orchestrator `<AgendaInteractive>`.
 */

import { getCalendarMonth, getCalendarMonthBlockedIntervals } from '@/domains/booking/calendar-service';
import { AgendaInteractive, type SerializedBlock } from './AgendaInteractive';
import type { SerializedEvent } from './MonthView';

interface MonthEventsProps {
  organizationId:  string;
  anchorDate:      Date;
  locale:          string;
  staffProfileId?: string;
}

function CalendarErrorFallback() {
  return (
    <div className="flex-1 flex items-center justify-center text-sm text-spa-muted"
         style={{ fontFamily: 'var(--font-sans)' }}>
      Não foi possível carregar o calendário.
    </div>
  );
}

export async function MonthEvents({ organizationId, anchorDate, locale, staffProfileId }: MonthEventsProps) {
  const monthRes = await getCalendarMonth(organizationId, anchorDate, staffProfileId);

  if (monthRes.error || !monthRes.data) {
    return <CalendarErrorFallback />;
  }

  const { events, gridStart, monthStart } = monthRes.data;

  // Grid spans exactly 42 days (6 weeks)
  const gridEnd = new Date(gridStart.getTime());
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 42);

  // Fetch blocked intervals for the visible grid window
  const blockedRes = await getCalendarMonthBlockedIntervals(organizationId, gridStart, gridEnd, staffProfileId);
  if (blockedRes.error || !blockedRes.data) {
    return <CalendarErrorFallback />;
  }

  const serializedEvents: SerializedEvent[] = events.map((e) => ({
    id:           e.id,
    customerName: e.customerName,
    serviceName:  e.serviceName,
    serviceColor: e.serviceColor,
    status:       e.status,
    startIso:     e.startAt.toISOString(),
  }));

  const serializedBlocked: SerializedBlock[] = blockedRes.data.map((b) => ({
    id:      b.id,
    dateIso: b.startAt.toISOString().slice(0, 10),
    reason:  b.reason,
  }));

  return (
    <AgendaInteractive
      gridStartIso={gridStart.toISOString().slice(0, 10)}
      monthStartIso={monthStart.toISOString().slice(0, 10)}
      events={serializedEvents}
      blockedIntervals={serializedBlocked}
      locale={locale}
    />
  );
}
