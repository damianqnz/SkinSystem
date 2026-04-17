/**
 * MonthEvents — async Server Component.
 * Wraps `getCalendarMonth`, serialises Dates → ISO strings, and hands off
 * to the client `<MonthView>`. Designed to be wrapped in <Suspense> so the
 * outer agenda shell streams instantly.
 */

import { getCalendarMonth } from '@/domains/booking/calendar-service';
import { MonthView, type SerializedEvent } from './MonthView';

interface MonthEventsProps {
  organizationId: string;
  anchorDate:     Date;
  locale:         string;
}

export async function MonthEvents({ organizationId, anchorDate, locale }: MonthEventsProps) {
  const result = await getCalendarMonth(organizationId, anchorDate);

  if (result.error || !result.data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-spa-muted"
           style={{ fontFamily: 'var(--font-sans)' }}>
        Não foi possível carregar o calendário.
      </div>
    );
  }

  const { events, gridStart, monthStart } = result.data;

  const serialized: SerializedEvent[] = events.map((e) => ({
    id:           e.id,
    customerName: e.customerName,
    serviceName:  e.serviceName,
    serviceColor: e.serviceColor,
    status:       e.status,
    startIso:     e.startAt.toISOString(),
  }));

  return (
    <MonthView
      gridStartIso={gridStart.toISOString().slice(0, 10)}
      monthStartIso={monthStart.toISOString().slice(0, 10)}
      events={serialized}
      locale={locale}
    />
  );
}
