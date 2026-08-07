'use client';

import { useState, useEffect, useTransition } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { getAvailableSlotsAction } from '../actions';
import { bookT, toIntlTag } from '../_i18n';
import type { PublicSlot } from '../actions';

// ── Date helpers ──────────────────────────────────────────────

function toLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function addMonths(d: Date, n: number): Date {
  const r = new Date(d.getFullYear(), d.getMonth() + n, 1);
  return r;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

// ── Calendar grid builder ─────────────────────────────────────

function buildCalendarDays(year: number, month: number, weekStartDay: number): (Date | null)[] {
  const firstDay  = new Date(year, month, 1);
  const lastDay   = new Date(year, month + 1, 0);
  const startWd   = firstDay.getDay(); // 0=Sun
  // offset: how many blank cells before day 1
  const offset    = (startWd - weekStartDay + 7) % 7;
  const days: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  // Pad to full grid
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

// ── Day header labels ─────────────────────────────────────────

function buildDayHeaders(weekStartDay: number, all: readonly string[]): string[] {
  return Array.from({ length: 7 }, (_, i) => all[(weekStartDay + i) % 7] ?? '');
}

// ── SlotGrid ──────────────────────────────────────────────────

interface SlotGridProps {
  slots:      PublicSlot[];
  selected:   string | null;
  onPick:     (slot: PublicSlot) => void;
  timeFormat: string;
  emptyLabel: string;
}

function formatSlotLabel(iso: string, timeFormat: string): string {
  const d = new Date(iso);
  if (timeFormat === '12h') {
    const h = d.getUTCHours();
    const m = d.getUTCMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'pm' : 'am';
    const h12  = h % 12 || 12;
    return `${h12}:${m} ${ampm}`;
  }
  return iso.slice(11, 16); // HH:MM UTC
}

function SlotGrid({ slots, selected, onPick, timeFormat, emptyLabel }: SlotGridProps) {
  if (slots.length === 0) {
    return (
      <p className="text-sm text-stone-400 text-center py-6">
        {emptyLabel}
      </p>
    );
  }
  return (
    <div className="grid grid-cols-3 gap-2">
      {slots.map((slot) => {
        const isSelected = slot.startISO === selected;
        const isLocked   = slot.status === 'locked';
        return (
          <button
            key={slot.startISO}
            type="button"
            disabled={isLocked}
            onClick={() => onPick(slot)}
            className={[
              'py-2 px-2 rounded-xl text-xs font-outfit font-medium transition-all duration-150 text-center',
              isSelected
                ? 'bg-stone-900 text-white shadow-sm'
                : isLocked
                  ? 'bg-amber-50 text-amber-600 cursor-not-allowed border border-amber-100'
                  : 'bg-stone-50 text-stone-700 hover:bg-amber-400 hover:text-stone-950 border border-stone-100',
            ].join(' ')}
          >
            {isLocked ? '🔒' : formatSlotLabel(slot.startISO, timeFormat)}
          </button>
        );
      })}
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────

interface Step2CalendarProps {
  serviceId:         string;
  locale:            string;
  weekStartDay:      number;   // 0=Sun, 1=Mon
  timeFormat:        string;   // '24h' | '12h'
  bookingWindowDays: number;
  leadTimeHours:     number;
  onSelect:          (slot: PublicSlot) => void;
}

// ── Component ─────────────────────────────────────────────────

export function Step2Calendar({
  serviceId,
  locale,
  weekStartDay,
  timeFormat,
  bookingWindowDays,
  leadTimeHours,
  onSelect,
}: Step2CalendarProps) {
  const t = bookT(locale);
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);

  // Earliest bookable date (lead time)
  const minDate = addDays(now, Math.ceil(leadTimeHours / 24));
  // Latest bookable date (window)
  const maxDate = addDays(now, bookingWindowDays);

  const [viewYear,       setViewYear]       = useState(minDate.getFullYear());
  const [viewMonth,      setViewMonth]       = useState(minDate.getMonth());
  const [selectedDate,   setSelectedDate]   = useState<string>(toLocalISO(minDate));
  const [selectedSlotISO, setSelectedSlotISO] = useState<string | null>(null);
  const [slots,           setSlots]          = useState<PublicSlot[]>([]);
  const [error,           setError]          = useState<string | null>(null);
  const [isPending,       startTransition]   = useTransition();

  const days       = buildCalendarDays(viewYear, viewMonth, weekStartDay);
  const dayHeaders = buildDayHeaders(weekStartDay, t.calendar.dayHeaders);

  // Load slots on date change
  useEffect(() => {
    setSelectedSlotISO(null);
    setError(null);
    startTransition(async () => {
      const result = await getAvailableSlotsAction(serviceId, selectedDate);
      if (result.error) { setError(result.error); setSlots([]); return; }
      setSlots(result.slots);
    });
  }, [serviceId, selectedDate]);

  function handleDayClick(d: Date) {
    const iso = toLocalISO(d);
    setSelectedDate(iso);
  }

  function handleSlotPick(slot: PublicSlot) {
    setSelectedSlotISO(slot.startISO);
    onSelect(slot);
  }

  function prevMonth() {
    const prev = addMonths(new Date(viewYear, viewMonth, 1), -1);
    // Don't go before current month
    const minMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (prev >= minMonth) {
      setViewYear(prev.getFullYear());
      setViewMonth(prev.getMonth());
    }
  }

  function nextMonth() {
    const next = addMonths(new Date(viewYear, viewMonth, 1), 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
  }

  function isDayDisabled(d: Date): boolean {
    const iso = toLocalISO(d);
    return iso < toLocalISO(minDate) || iso > toLocalISO(maxDate);
  }

  const selectedDateLabel = (() => {
    const d = new Date(selectedDate + 'T12:00:00Z');
    return d.toLocaleDateString(toIntlTag(locale), {
      weekday: 'long', day: 'numeric', month: 'long',
    });
  })();

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-5 text-center">
        {t.calendar.heading}
      </h2>

      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={prevMonth}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-cormorant text-base font-semibold text-stone-800">
          {t.calendar.monthNames[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {dayHeaders.map((h) => (
          <div key={h} className="text-center text-[10px] font-medium text-stone-400 uppercase tracking-wide py-1">
            {h}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-0.5 mb-5">
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const iso      = toLocalISO(d);
          const isSelected = iso === selectedDate;
          const disabled   = isDayDisabled(d);
          const isToday    = sameDay(d, now);
          return (
            <button
              key={iso}
              type="button"
              disabled={disabled}
              onClick={() => handleDayClick(d)}
              className={[
                'aspect-square flex items-center justify-center rounded-xl text-xs font-outfit transition-colors',
                isSelected
                  ? 'bg-stone-900 text-white font-semibold'
                  : disabled
                    ? 'text-stone-200 cursor-not-allowed'
                    : isToday
                      ? 'text-amber-500 font-semibold hover:bg-amber-50'
                      : 'text-stone-700 hover:bg-stone-100',
              ].join(' ')}
            >
              {d.getDate()}
            </button>
          );
        })}
      </div>

      {/* Slots section */}
      <div className="border-t border-stone-100 pt-4">
        <p className="text-xs font-medium text-stone-500 capitalize mb-3">
          {selectedDateLabel}
        </p>
        {isPending ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-stone-300" />
          </div>
        ) : error ? (
          <p className="text-sm text-red-400 text-center py-4">{error}</p>
        ) : (
          <SlotGrid
            slots={slots}
            selected={selectedSlotISO}
            onPick={handleSlotPick}
            timeFormat={timeFormat}
            emptyLabel={t.calendar.empty}
          />
        )}
      </div>
    </div>
  );
}
