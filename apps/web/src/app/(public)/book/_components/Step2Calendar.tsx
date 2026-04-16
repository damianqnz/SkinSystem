'use client';

import { useState, useEffect, useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { getAvailableSlotsAction } from '../actions';
import type { PublicSlot } from '../actions';

// ── Date helpers ──────────────────────────────────────────────

function toDateISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

const DAY_LABELS: string[] = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MONTH_LABELS: string[] = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDayLabel(d: Date, _locale: string): string {
  const day   = DAY_LABELS[d.getDay()]   ?? '';
  const month = MONTH_LABELS[d.getMonth()] ?? '';
  return `${day} ${d.getDate()} ${month}`;
}

// ── Sub-components ────────────────────────────────────────────

interface SlotGridProps {
  slots:    PublicSlot[];
  selected: string | null;
  onPick:   (slot: PublicSlot) => void;
}

function SlotGrid({ slots, selected, onPick }: SlotGridProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-8">
        No hay horarios disponibles para este día
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const isSelected = slot.startISO === selected;
        const isLocked   = slot.status === 'locked';
        return (
          <button
            key={slot.startISO}
            disabled={isLocked}
            onClick={() => onPick(slot)}
            className={[
              'py-2.5 px-3 rounded-xl text-sm font-outfit font-medium transition-all duration-150',
              isSelected
                ? 'bg-stone-900 text-white shadow-sm'
                : isLocked
                  ? 'bg-amber-50 text-amber-600 text-[11px] cursor-not-allowed border border-amber-100'
                  : 'bg-stone-50 text-stone-700 hover:bg-amber-400 hover:text-stone-950 border border-stone-100',
            ].join(' ')}
          >
            {isLocked ? '🔒 proceso' : slot.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────

interface Step2CalendarProps {
  serviceId:    string;
  locale:       string;
  onSelect:     (slot: PublicSlot) => void;
  initialDate?: string;   // YYYY-MM-DD, from URL param if provided
}

const NUM_DAYS = 14;

export function Step2Calendar({
  serviceId,
  locale,
  onSelect,
  initialDate,
}: Step2CalendarProps) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [selectedDate,    setSelectedDate]    = useState<string>(initialDate ?? toDateISO(today));
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [slots,           setSlots]           = useState<PublicSlot[]>([]);
  const [error,           setError]           = useState<string | null>(null);
  const [isPending,       startTransition]    = useTransition();

  // Days array (today + NUM_DAYS)
  const days = Array.from({ length: NUM_DAYS }, (_, i) => addDays(today, i));

  // Load slots when date or serviceId changes
  useEffect(() => {
    setSelectedSlotISO(null);
    setError(null);
    startTransition(async () => {
      const result = await getAvailableSlotsAction(serviceId, selectedDate);
      if (result.error) { setError(result.error); setSlots([]); return; }
      setSlots(result.slots);
    });
  }, [serviceId, selectedDate]);

  function handleSlotPick(slot: PublicSlot) {
    setSelectedSlotISO(slot.startISO);
    onSelect(slot);
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-6 text-center">
        Elige fecha y hora
      </h2>

      {/* Date strip */}
      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-6">
        {days.map((d) => {
          const iso    = toDateISO(d);
          const active = iso === selectedDate;
          const isToday = iso === toDateISO(today);
          return (
            <button
              key={iso}
              onClick={() => setSelectedDate(iso)}
              className={[
                'flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-xl text-xs font-outfit transition-colors',
                active
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border border-stone-100',
              ].join(' ')}
            >
              <span className={['font-medium', isToday && !active ? 'text-amber-500' : ''].join(' ')}>
                {isToday ? 'Hoy' : fmtDayLabel(d, locale).slice(0, 3)}
              </span>
              <span className={[
                'text-[11px] mt-0.5',
                active ? 'text-stone-300' : 'text-stone-400',
              ].join(' ')}>
                {d.getDate()}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected date label */}
      <p className="text-xs text-stone-400 mb-3 font-outfit">
        {fmtDayLabel(new Date(selectedDate + 'T12:00:00Z'), locale)}
      </p>

      {/* Slots */}
      {isPending ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 size={20} className="animate-spin text-stone-400" />
        </div>
      ) : error ? (
        <p className="text-sm text-red-400 text-center py-6">{error}</p>
      ) : (
        <SlotGrid slots={slots} selected={selectedSlotISO} onPick={handleSlotPick} />
      )}
    </div>
  );
}
