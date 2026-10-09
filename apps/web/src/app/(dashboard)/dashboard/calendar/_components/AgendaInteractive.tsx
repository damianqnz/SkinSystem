'use client';

import { useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MonthView, type SerializedEvent }          from './MonthView';
import { MonthActionModal }                          from './MonthActionModal';
import { NewAppointmentFAB }                         from './NewAppointmentFAB';
import { AppointmentDetailModal }                    from '@/shared/components/booking/AppointmentDetailModal';

// ── Types ──────────────────────────────────────────────────────

export type SerializedBlock = { id: string; dateIso: string; reason: string };

type Active =
  | null
  | { kind: 'slot';   dateIso: string; date: Date }
  | { kind: 'detail'; appointmentId: string; preview: { customerName: string; serviceColor: string | null } | null };

interface AgendaInteractiveProps {
  gridStartIso:     string;
  monthStartIso:    string;
  events:           SerializedEvent[];
  blockedIntervals: SerializedBlock[];
  locale:           string;
}

/**
 * Client orchestrator: holds dialog/sheet state and wires
 * MonthView cell+chip clicks to the right surface.
 *
 * Cell click → MonthActionModal (block days OR schedule appointment).
 * Chip click → EventDetailSheet.
 */
export function AgendaInteractive({
  gridStartIso,
  monthStartIso,
  events,
  blockedIntervals,
  locale,
}: AgendaInteractiveProps) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [active,     setActive]     = useState<Active>(null);
  const [fabOpen,    setFabOpen]    = useState(false);
  const [fabDateIso, setFabDateIso] = useState('');

  // `?new=appointment` (from the calendar "+" menu) opens the FAB on load;
  // dropping only `new` on close keeps refresh/back from reopening the modal.
  const newAppointmentRequested = searchParams.get('new') === 'appointment';

  const clearNewParam = () => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('new');
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const close = () => setActive(null);

  const refreshAndClose = () => {
    router.refresh();
    close();
  };

  const handleCellClick = (dateIso: string) => {
    setActive({ kind: 'slot', dateIso, date: new Date(`${dateIso}T12:00:00Z`) });
  };

  const handleChipClick = (
    appointmentId: string,
    preview: { customerName: string; serviceColor: string | null },
  ) => {
    setActive({ kind: 'detail', appointmentId, preview });
  };

  // "Agendar cita" from MonthActionModal → open FAB with clicked date
  const handleSchedule = () => {
    if (active?.kind === 'slot') setFabDateIso(active.dateIso);
    close();
    setFabOpen(true);
  };

  const dateForFab = fabDateIso ? new Date(`${fabDateIso}T12:00:00Z`) : new Date();

  return (
    <>
      <MonthView
        gridStartIso={gridStartIso}
        monthStartIso={monthStartIso}
        events={events}
        blockedIntervals={blockedIntervals}
        locale={locale}
        onCellClick={handleCellClick}
        onChipClick={handleChipClick}
      />

      {/* Month action modal (block days / schedule) ─────── */}
      <MonthActionModal
        open={active?.kind === 'slot'}
        onClose={refreshAndClose}
        selectedDate={active?.kind === 'slot' ? active.date : new Date()}
        onSchedule={handleSchedule}
      />

      {/* New Appointment FAB ──────────────────────────────── */}
      <NewAppointmentFAB
        locale={locale}
        date={dateForFab}
        externalOpen={fabOpen || newAppointmentRequested}
        onExternalClose={() => {
          setFabOpen(false);
          if (newAppointmentRequested) clearNewParam();
          router.refresh();
        }}
      />

      {/* Appointment detail modal (centered) ────────────── */}
      <AppointmentDetailModal
        appointmentId={active?.kind === 'detail' ? active.appointmentId : null}
        onClose={close}
        preview={active?.kind === 'detail' ? active.preview : null}
        locale={locale}
        onMutated={() => router.refresh()}
      />
    </>
  );
}
