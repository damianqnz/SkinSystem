/**
 * MonthEvents — async Server Component.
 *
 * Fetches month events + the supporting catalog/customers in parallel,
 * serialises Dates → ISO and hands off to the client orchestrator
 * `<AgendaInteractive>` which hosts MonthView and the dialogs/sheet.
 */

import { getCalendarMonth } from '@/domains/booking/calendar-service';
import { getActiveServices } from '@/domains/catalog/service';
import { getCustomersList }  from '@/domains/customers/service';
import { AgendaInteractive } from './AgendaInteractive';
import type { SerializedEvent } from './MonthView';
import type { ServiceOption }   from './NewAppointmentForm';
import type { CustomerOption }  from './CustomerCombobox';

interface MonthEventsProps {
  organizationId: string;
  anchorDate:     Date;
  locale:         string;
  tenantName:     string;
}

export async function MonthEvents({
  organizationId,
  anchorDate,
  locale,
  tenantName,
}: MonthEventsProps) {
  // Parallel fetch — all three are independent
  const [monthRes, servicesRes, customersRes] = await Promise.all([
    getCalendarMonth(organizationId, anchorDate),
    getActiveServices(organizationId),
    getCustomersList(organizationId),
  ]);

  if (monthRes.error || !monthRes.data) {
    return (
      <div className="flex-1 flex items-center justify-center text-sm text-spa-muted"
           style={{ fontFamily: 'var(--font-sans)' }}>
        Não foi possível carregar o calendário.
      </div>
    );
  }

  const { events, gridStart, monthStart } = monthRes.data;

  const serializedEvents: SerializedEvent[] = events.map((e) => ({
    id:           e.id,
    customerName: e.customerName,
    serviceName:  e.serviceName,
    serviceColor: e.serviceColor,
    status:       e.status,
    startIso:     e.startAt.toISOString(),
  }));

  const services: ServiceOption[] = (servicesRes.data ?? []).map((s) => ({
    id:              s.id,
    nameI18n:        (s.nameI18n as Record<string, string>) ?? {},
    durationMinutes: s.durationMinutes,
    priceCents:      s.priceCents,
    color:           s.color,
  }));

  const customers: CustomerOption[] = (customersRes.data ?? []).map((c) => ({
    id:       c.id,
    fullName: c.fullName,
    email:    c.email,
    phone:    c.phone,
  }));

  return (
    <AgendaInteractive
      gridStartIso={gridStart.toISOString().slice(0, 10)}
      monthStartIso={monthStart.toISOString().slice(0, 10)}
      events={serializedEvents}
      services={services}
      customers={customers}
      tenantName={tenantName}
      locale={locale}
    />
  );
}
