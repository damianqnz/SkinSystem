/**
 * MonthEvents — async Server Component.
 *
 * Fetches month events + blocked intervals in parallel, serialises Dates → ISO
 * and hands off to the client orchestrator `<AgendaInteractive>`.
 */

import { and, eq, gte, lt } from 'drizzle-orm';
import { getCalendarMonth }  from '@/domains/booking/calendar-service';
import { db }                from '@/infrastructure/db';
import { blockedIntervals }  from '@/infrastructure/db/schema/calendar';
import { AgendaInteractive, type SerializedBlock } from './AgendaInteractive';
import type { SerializedEvent } from './MonthView';

interface MonthEventsProps {
  organizationId: string;
  anchorDate:     Date;
  locale:         string;
}

export async function MonthEvents({ organizationId, anchorDate, locale }: MonthEventsProps) {
  const monthRes = await getCalendarMonth(organizationId, anchorDate);

  if (monthRes.error || !monthRes.data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-spa-muted"
           style={{ fontFamily: 'var(--font-sans)' }}>
        Não foi possível carregar o calendário.
      </div>
    );
  }

  const { events, gridStart, monthStart } = monthRes.data;

  // Grid spans exactly 42 days (6 weeks)
  const gridEnd = new Date(gridStart.getTime());
  gridEnd.setUTCDate(gridEnd.getUTCDate() + 42);

  // Fetch blocked intervals for the visible grid window
  const blockedRows = await db
    .select({ id: blockedIntervals.id, startAt: blockedIntervals.startAt, reason: blockedIntervals.reason })
    .from(blockedIntervals)
    .where(and(
      eq(blockedIntervals.organizationId, organizationId),
      gte(blockedIntervals.startAt, gridStart),
      lt(blockedIntervals.startAt, gridEnd),
    ));

  const serializedEvents: SerializedEvent[] = events.map((e) => ({
    id:           e.id,
    customerName: e.customerName,
    serviceName:  e.serviceName,
    serviceColor: e.serviceColor,
    status:       e.status,
    startIso:     e.startAt.toISOString(),
  }));

  const serializedBlocked: SerializedBlock[] = blockedRows.map((b) => ({
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
