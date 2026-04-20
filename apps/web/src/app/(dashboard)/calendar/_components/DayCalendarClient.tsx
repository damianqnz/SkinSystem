/**
 * @deprecated Use CalendarDayView instead.
 * CalendarDayView adds AppointmentDetailModal support.
 */
'use client';

import { useState, useCallback } from 'react';
import { DayTimeGrid, type DayViewSer }            from './DayTimeGrid';
import { SlotActionModal }                          from '@/shared/components/booking/SlotActionModal';
import { NewAppointmentFAB }                        from './NewAppointmentFAB';

interface DayCalendarClientProps {
  data:   DayViewSer;
  date:   Date;
  locale: string;
}

type SelectedSlot = { time: string; date: string; isBusinessHour: boolean };

export function DayCalendarClient({ data, date, locale }: DayCalendarClientProps) {
  const [modalOpen, setModalOpen]   = useState(false);
  const [selected,  setSelected]    = useState<SelectedSlot | null>(null);
  const [fabOpen,   setFabOpen]     = useState(false);
  const [fabTime,   setFabTime]     = useState<string | undefined>();

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
    </>
  );
}
