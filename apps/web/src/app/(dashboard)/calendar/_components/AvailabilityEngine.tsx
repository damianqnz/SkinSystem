import { calculateAvailableSlots } from '@/domains/booking/service';
import { DayTimeGrid } from './DayTimeGrid';

interface AvailabilityEngineProps {
  organizationId: string;
  serviceId:      string;
  date:           Date;
  locale:         string;
}

/**
 * AvailabilityEngine — async Server Component, wrapped in Suspense by parent.
 *
 * Fetches slots from:
 *   - DB: availabilityRules, appointments, blockedIntervals
 *   - Redis: locked slot keys (5-min checkout locks, WF-01)
 *
 * Passes serialized slots to DayTimeGrid (Client Component).
 */
export async function AvailabilityEngine({
  organizationId,
  serviceId,
  date,
  locale,
}: AvailabilityEngineProps) {
  const result = await calculateAvailableSlots(organizationId, serviceId, date);

  if (result.error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <p className="text-sm text-red-400">{result.error.message}</p>
      </div>
    );
  }

  // Serialize Dates → ISO strings for RSC boundary
  const slots = result.data.map((s) => ({
    ...s,
    startAt: s.startAt instanceof Date ? s.startAt : new Date(s.startAt),
    endAt:   s.endAt   instanceof Date ? s.endAt   : new Date(s.endAt),
  }));

  const stats = {
    available: slots.filter((s) => s.status === 'available').length,
    booked:    slots.filter((s) => s.status === 'booked').length,
    locked:    slots.filter((s) => s.status === 'locked').length,
  };

  return (
    <div className="flex flex-col min-h-0">
      {/* Stats bar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-stone-100 bg-stone-50/50">
        <StatPill
          value={stats.available}
          label={locale === 'pt' ? 'disponíveis' : locale === 'en' ? 'available' : 'disponibles'}
          color="text-emerald-600"
        />
        <StatPill
          value={stats.booked}
          label={locale === 'pt' ? 'reservados' : locale === 'en' ? 'booked' : 'reservados'}
          color="text-sky-600"
        />
        {stats.locked > 0 && (
          <StatPill
            value={stats.locked}
            label={locale === 'pt' ? 'em checkout' : locale === 'en' ? 'in checkout' : 'en proceso'}
            color="text-amber-600"
          />
        )}
      </div>

      <DayTimeGrid
        slots={slots}
        date={date}
        locale={locale}
      />
    </div>
  );
}

function StatPill({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color: string;
}) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-stone-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}
