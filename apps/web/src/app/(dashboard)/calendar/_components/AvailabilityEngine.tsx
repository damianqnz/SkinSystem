import { getDayView }        from '@/domains/booking/day-view-service';
import { CalendarDayView }   from './CalendarDayView';
import type { DayViewSer }   from './DayTimeGrid';

interface AvailabilityEngineProps {
  organizationId: string;
  date:           Date;
  locale:         string;
}

/**
 * AvailabilityEngine — async Server Component, wrapped in Suspense by parent.
 *
 * Fetches the full day snapshot via getDayView:
 *   - availability_rules → business hours
 *   - appointments       → confirmed/pending/in_progress + customer + service names
 *   - blocked_intervals  → manual blocks
 *
 * Serializes Dates → ISO strings at the RSC boundary before passing
 * to DayCalendarClient (Client Component).
 *
 * Tenant isolation: all queries in getDayView are filtered by organizationId.
 */
export async function AvailabilityEngine({
  organizationId,
  date,
  locale,
}: AvailabilityEngineProps) {
  const result = await getDayView(organizationId, date);

  if (result.error) {
    return (
      <div className="flex items-center justify-center py-16 px-4">
        <p className="text-sm text-red-400">{result.error.message}</p>
      </div>
    );
  }

  const dv = result.data;

  // Serialize Dates → ISO strings for RSC → Client boundary
  const data: DayViewSer = {
    businessStart:    dv.businessStart,
    businessEnd:      dv.businessEnd,
    isOpen:           dv.isOpen,
    appointments:     dv.appointments.map((a) => ({
      id:           a.id,
      startAt:      a.startAt.toISOString(),
      endAt:        a.endAt.toISOString(),
      status:       a.status,
      customerName: a.customerName,
      serviceName:  a.serviceName,
    })),
    blockedIntervals: dv.blockedIntervals.map((b) => ({
      id:      b.id,
      startAt: b.startAt.toISOString(),
      endAt:   b.endAt.toISOString(),
      reason:  b.reason,
    })),
  };

  return <CalendarDayView data={data} date={date} locale={locale} />;
}
