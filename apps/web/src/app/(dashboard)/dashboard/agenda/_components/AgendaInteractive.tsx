'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MonthView, type SerializedEvent } from './MonthView';
import { ChooseActionDialog } from './ChooseActionDialog';
import { BlockDateForm }      from './BlockDateForm';
import { NewAppointmentForm, type ServiceOption } from './NewAppointmentForm';
import { EventDetailSheet }   from './EventDetailSheet';
import type { CustomerOption } from './CustomerCombobox';

// ── Active-dialog discriminated union ──────────────────────────

type Active =
  | null
  | { kind: 'choose';   dateIso: string }
  | { kind: 'block';    dateIso: string }
  | { kind: 'appoint';  dateIso: string }
  | { kind: 'detail';   appointmentId: string; preview: { customerName: string; serviceColor: string | null } | null };

interface AgendaInteractiveProps {
  gridStartIso:  string;
  monthStartIso: string;
  events:        SerializedEvent[];
  services:      ServiceOption[];
  customers:     CustomerOption[];
  tenantName:    string;
  locale:        string;
}

/**
 * Client orchestrator: holds the dialog/sheet state and wires
 * MonthView cell+chip clicks to the right surface.
 */
export function AgendaInteractive({
  gridStartIso,
  monthStartIso,
  events,
  services,
  customers,
  tenantName,
  locale,
}: AgendaInteractiveProps) {
  const router = useRouter();
  const [active, setActive] = useState<Active>(null);

  // Empty cell click → show the choose-action dialog
  const handleCellClick = (dateIso: string) => {
    setActive({ kind: 'choose', dateIso });
  };

  // Chip click → side sheet with details
  const handleChipClick = (
    appointmentId: string,
    preview: { customerName: string; serviceColor: string | null },
  ) => {
    setActive({ kind: 'detail', appointmentId, preview });
  };

  const close = () => setActive(null);

  // After successful mutation: refresh server data and close
  const refreshAndClose = () => {
    router.refresh();
    close();
  };

  return (
    <>
      <MonthView
        gridStartIso={gridStartIso}
        monthStartIso={monthStartIso}
        events={events}
        locale={locale}
        onCellClick={handleCellClick}
        onChipClick={handleChipClick}
      />

      {/* Choose action ──────────────────────── */}
      <ChooseActionDialog
        open={active?.kind === 'choose'}
        onOpenChange={(o) => { if (!o) close(); }}
        dateIso={active?.kind === 'choose' ? active.dateIso : ''}
        onPickBlock={() => {
          if (active?.kind === 'choose') setActive({ kind: 'block', dateIso: active.dateIso });
        }}
        onPickAppoint={() => {
          if (active?.kind === 'choose') setActive({ kind: 'appoint', dateIso: active.dateIso });
        }}
        locale={locale}
      />

      {/* Block date ─────────────────────────── */}
      <BlockDateForm
        open={active?.kind === 'block'}
        onOpenChange={(o) => { if (!o) close(); }}
        onBack={() => {
          if (active?.kind === 'block') setActive({ kind: 'choose', dateIso: active.dateIso });
        }}
        defaultDateIso={active?.kind === 'block' ? active.dateIso : todayIso()}
        onSuccess={refreshAndClose}
      />

      {/* New appointment ────────────────────── */}
      <NewAppointmentForm
        open={active?.kind === 'appoint'}
        onOpenChange={(o) => { if (!o) close(); }}
        onBack={() => {
          if (active?.kind === 'appoint') setActive({ kind: 'choose', dateIso: active.dateIso });
        }}
        defaultDateIso={active?.kind === 'appoint' ? active.dateIso : todayIso()}
        services={services}
        customers={customers}
        tenantName={tenantName}
        locale={locale}
        onSuccess={refreshAndClose}
      />

      {/* Detail sheet ───────────────────────── */}
      <EventDetailSheet
        open={active?.kind === 'detail'}
        onOpenChange={(o) => { if (!o) close(); }}
        appointmentId={active?.kind === 'detail' ? active.appointmentId : null}
        preview={active?.kind === 'detail' ? active.preview : null}
        locale={locale}
        onMutated={() => router.refresh()}
      />
    </>
  );
}

function todayIso(): string {
  const now = new Date();
  const m = (now.getMonth() + 1).toString().padStart(2, '0');
  const d = now.getDate().toString().padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}
