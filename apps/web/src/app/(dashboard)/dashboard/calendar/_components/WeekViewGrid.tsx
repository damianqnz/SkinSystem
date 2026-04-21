'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter }                       from 'next/navigation';
import { DesktopWeekGrid }                 from './DesktopWeekGrid';
import { MobileWeekDaySelector }           from './MobileWeekDaySelector';
import { MobileWeekTimeList }              from './MobileWeekTimeList';
import { SlotActionModal }                 from '@/shared/components/booking/SlotActionModal';
import { NewAppointmentFAB }               from './NewAppointmentFAB';
import { AppointmentDetailModal }          from '@/shared/components/booking/AppointmentDetailModal';
import type { WeekDaySer }                 from './week-utils';

// ── Types ─────────────────────────────────────────────────────

type SelectedSlot = { dateIso: string; time: string; isBusinessHour: boolean };

interface WeekViewGridProps {
  weekDays:     WeekDaySer[];
  weekStartIso: string;
  locale:       string;
}

// ── Component ─────────────────────────────────────────────────

export function WeekViewGrid({ weekDays, weekStartIso, locale }: WeekViewGridProps) {
  const router = useRouter();

  const [selected,       setSelected]       = useState<SelectedSlot | null>(null);
  const [modalOpen,      setModalOpen]      = useState(false);
  const [fabOpen,        setFabOpen]        = useState(false);
  const [fabTime,        setFabTime]        = useState<string | undefined>();
  const [fabDateIso,     setFabDateIso]     = useState(weekStartIso);
  const [mobileDayIdx,   setMobileDayIdx]   = useState(0);
  const [selectedApptId, setSelectedApptId] = useState<string | null>(null);

  const handleHourClick = useCallback((dateIso: string, time: string, isBusinessHour: boolean) => {
    setSelected({ dateIso, time, isBusinessHour });
    setModalOpen(true);
  }, []);

  const handleSchedule = useCallback((time?: string) => {
    setFabDateIso(selected?.dateIso ?? weekStartIso);
    setFabTime(time);
    setFabOpen(true);
  }, [selected?.dateIso, weekStartIso]);

  const fabDate = useMemo(
    () => new Date(fabDateIso + 'T12:00:00Z'),
    [fabDateIso],
  );

  const mobileDay = weekDays[mobileDayIdx] ?? weekDays[0]!;

  return (
    <>
      {/* ── Desktop ───────────────────────────────────────── */}
      <DesktopWeekGrid
        weekDays={weekDays}
        locale={locale}
        onHourClick={handleHourClick}
        onAppointmentClick={setSelectedApptId}
      />

      {/* ── Mobile ───────────────────────────────────────── */}
      <div className="flex flex-col md:hidden flex-1 min-h-0">
        <MobileWeekDaySelector
          weekDays={weekDays}
          selectedIdx={mobileDayIdx}
          locale={locale}
          onChange={setMobileDayIdx}
        />
        <MobileWeekTimeList
          day={mobileDay}
          locale={locale}
          onHourClick={handleHourClick}
          onAppointmentClick={setSelectedApptId}
        />
      </div>

      {/* ── Slot action modal ─────────────────────────────── */}
      <SlotActionModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); router.refresh(); }}
        date={selected?.dateIso ?? ''}
        slotTime={selected?.time}
        isBusinessHour={selected?.isBusinessHour ?? true}
        locale={locale}
        onSchedule={handleSchedule}
      />

      {/* ── New appointment FAB ───────────────────────────── */}
      <NewAppointmentFAB
        locale={locale}
        date={fabDate}
        initialTime={fabTime}
        externalOpen={fabOpen}
        onExternalClose={() => { setFabOpen(false); setFabTime(undefined); router.refresh(); }}
      />

      {/* ── Appointment detail modal ──────────────────────── */}
      <AppointmentDetailModal
        appointmentId={selectedApptId}
        onClose={() => setSelectedApptId(null)}
        locale={locale}
        onMutated={() => router.refresh()}
      />
    </>
  );
}
