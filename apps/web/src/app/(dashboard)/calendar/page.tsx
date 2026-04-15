import { Suspense }    from 'react';
import { headers }     from 'next/headers';
import { notFound }    from 'next/navigation';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getActiveServices }     from '@/domains/catalog/service';
import { CalendarDayNav }        from './_components/CalendarDayNav';
import { AvailabilityEngine }    from './_components/AvailabilityEngine';
import { CalendarSkeleton }      from './_components/CalendarSkeleton';
import { NewAppointmentFAB }     from './_components/NewAppointmentFAB';

interface CalendarPageProps {
  searchParams: Promise<{
    date?:       string;  // "YYYY-MM-DD" — defaults to today
    serviceId?:  string;  // UUID — defaults to first active service
  }>;
}

/**
 * /calendar — Slot Availability Calendar
 *
 * PPR pattern:
 *   Static:   CalendarDayNav (date picker + service selector)
 *   Streamed: AvailabilityEngine (DB + Redis — availability per slot)
 *
 * Slot status rendered by AvailabilityEngine:
 *   available · booked · locked (Redis 5-min) · buffer · blocked · break
 *
 * Tenant isolation: every query scoped to organization_id from x-tenant-slug.
 */
export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

  const { date: dateParam, serviceId: serviceParam } = await searchParams;

  // ── Resolve organization ──────────────────────────────────
  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  // ── Resolve services ──────────────────────────────────────
  const svcResult = await getActiveServices(org.id);
  const services  = svcResult.data ?? [];

  if (services.length === 0) {
    return <NoServicesState locale={locale} />;
  }

  // Map services to { id, name } — resolve i18n name for selector
  const serviceList = services.map((s) => ({
    id:   s.id,
    name: resolveI18n(s.nameI18n as Record<string, string>, locale),
  }));

  // Selected service (default: first)
  const serviceId = serviceParam && services.some((s) => s.id === serviceParam)
    ? serviceParam
    : services[0]!.id;

  // ── Resolve anchor date ───────────────────────────────────
  const anchorDate = dateParam
    ? new Date(dateParam + 'T00:00:00Z')
    : (() => { const d = new Date(); d.setUTCHours(0, 0, 0, 0); return d; })();

  return (
    <div className="flex flex-col h-full min-h-0">

      {/* ── Static shell: Day navigation + service tabs ── */}
      <CalendarDayNav
        date={anchorDate}
        locale={locale}
        services={serviceList}
        serviceId={serviceId}
      />

      {/* ── Streamed: Slot availability engine ─────────── */}
      <Suspense key={`${anchorDate.toISOString()}-${serviceId}`} fallback={<CalendarSkeleton />}>
        <AvailabilityEngine
          organizationId={org.id}
          serviceId={serviceId}
          date={anchorDate}
          locale={locale}
        />
      </Suspense>

      {/* ── FAB: New appointment (Thumb-Zone) ───────────── */}
      <NewAppointmentFAB locale={locale} date={anchorDate} />
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────

function resolveI18n(obj: Record<string, string>, locale: string): string {
  return obj[locale] ?? obj['es'] ?? obj['en'] ?? Object.values(obj)[0] ?? '—';
}

function NoServicesState({ locale }: { locale: string }) {
  const msgs: Record<string, { title: string; body: string }> = {
    es: { title: 'Sin servicios activos', body: 'Añade al menos un servicio en el catálogo para ver la disponibilidad.' },
    pt: { title: 'Sem serviços ativos',   body: 'Adicione pelo menos um serviço ao catálogo para ver a disponibilidade.' },
    en: { title: 'No active services',    body: 'Add at least one service to the catalog to view availability.' },
  };
  const m = msgs[locale] ?? msgs['es']!;
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 px-6 text-center">
      <p className="font-cormorant text-xl text-stone-500 mb-2">{m.title}</p>
      <p className="text-sm text-stone-400 max-w-xs">{m.body}</p>
    </div>
  );
}
