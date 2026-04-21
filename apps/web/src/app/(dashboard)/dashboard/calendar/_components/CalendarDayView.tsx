'use client';

import { useState, useCallback }                          from 'react';
import { useRouter }                                      from 'next/navigation';
import { DayTimeGrid, type DayViewSer }                   from './DayTimeGrid';
import { SlotActionModal }                                from '@/shared/components/booking/SlotActionModal';
import { NewAppointmentFAB }                              from './NewAppointmentFAB';
import { AppointmentDetailModal }                         from '@/shared/components/booking/AppointmentDetailModal';

// ── Types ─────────────────────────────────────────────────────

interface CalendarDayViewProps {
  data:   DayViewSer;
  date:   Date;
  locale: string;
}

type SelectedSlot = { time: string; date: string; isBusinessHour: boolean };

// ── Component ─────────────────────────────────────────────────

/**
 * CalendarDayView — client orchestrator for the day calendar.
 *
 * Manages:
 *   - Hour-click → SlotActionModal (block or schedule)
 *   - Appointment-click → AppointmentDetailModal (centered)
 *   - Schedule → NewAppointmentFAB (pre-filled time)
 */
export function CalendarDayView({ data, date, locale }: CalendarDayViewProps) {
  const router = useRouter();

  const [modalOpen,      setModalOpen]      = useState(false);
  const [selected,       setSelected]       = useState<SelectedSlot | null>(null);
  const [fabOpen,        setFabOpen]        = useState(false);
  const [fabTime,        setFabTime]        = useState<string | undefined>();
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  const dateStr = date.toISOString().slice(0, 10);

  const handleHourClick = useCallback((time: string, isBusinessHour: boolean) => {
    setSelected({ time, date: dateStr, isBusinessHour });
    setModalOpen(true);
  }, [dateStr]);

  const handleSchedule = useCallback((time?: string) => {
    setFabTime(time);
    setFabOpen(true);
  }, []);

  return (
    <>
      <DayTimeGrid
        data={data}
        locale={locale}
        onHourClick={handleHourClick}
        onAppointmentClick={setSelectedApptId}
      />

      <SlotActionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={selected?.date ?? ''}
        slotTime={selected?.time}
        isBusinessHour={selected?.isBusinessHour ?? true}
        locale={locale}
        onSchedule={handleSchedule}
      />

      <NewAppointmentFAB
        locale={locale}
        date={date}
        initialTime={fabTime}
        externalOpen={fabOpen}
        onExternalClose={() => { setFabOpen(false); setFabTime(undefined); }}
      />

      <AppointmentDetailModal
        appointmentId={selectedApptId}
        onClose={() => setSelectedApptId(null)}
        locale={locale}
        onMutated={() => router.refresh()}
      />
    </>
  );
}
