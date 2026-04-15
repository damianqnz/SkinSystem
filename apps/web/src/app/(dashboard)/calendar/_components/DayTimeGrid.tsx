'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SlotCell } from './SlotCell';
import type { ComputedSlot } from '@/domains/booking/service';

interface DayTimeGridProps {
  slots:     ComputedSlot[];
  date:      Date;
  locale:    string;
  onSlotClick?: (slot: ComputedSlot) => void;
}

// ── Status legend ─────────────────────────────────────────────

const LEGEND = [
  { status: 'available',  dot: 'bg-stone-200',  label: { es: 'Disponible', pt: 'Disponível', en: 'Available' } },
  { status: 'booked',     dot: 'bg-sky-400',    label: { es: 'Reservado',  pt: 'Reservado',  en: 'Booked'    } },
  { status: 'locked',     dot: 'bg-amber-400',  label: { es: 'En proceso', pt: 'Em processo', en: 'In checkout' } },
  { status: 'buffer',     dot: 'bg-slate-300',  label: { es: 'Buffer',     pt: 'Buffer',     en: 'Buffer'    } },
  { status: 'blocked',    dot: 'bg-slate-400',  label: { es: 'Bloqueado',  pt: 'Bloqueado',  en: 'Blocked'   } },
] as const;

// ── Slot time formatter ───────────────────────────────────────

function fmtTime(d: Date): string {
  return d.toISOString().slice(11, 16); // "HH:MM" (UTC)
}

// ── Status → customer label resolver ─────────────────────────

type CustomerMap = Map<string, string>; // appointmentId → customerName

// ── Component ─────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

export function DayTimeGrid({
  slots,
  date,
  locale,
  onSlotClick,
}: DayTimeGridProps) {
  const [prevDate, setPrevDate] = useState<Date>(date);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (date.getTime() !== prevDate.getTime()) {
    setDirection(date > prevDate ? 1 : -1);
    setPrevDate(date);
  }

  const visible = slots.filter((s) => s.status !== 'outside_hours');
  const hasAny  = visible.length > 0;

  // Group slots into hour sections for visual clarity
  const grouped = groupByHour(visible);

  return (
    <div className="flex flex-col min-h-0">
      {/* Status legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 border-b border-stone-100">
        {LEGEND.map((l) => (
          <div key={l.status} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${l.dot}`} />
            <span className="text-[10px] text-stone-500 uppercase tracking-wide">
              {l.label[locale as keyof typeof l.label] ?? l.label.es}
            </span>
          </div>
        ))}
      </div>

      {/* Animated slot grid */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={date.toISOString()}
          initial={{ opacity: 0, x: direction * 32 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: direction * -32 }}
          transition={{ duration: 0.22, ease: EASE }}
          className="flex-1 overflow-y-auto px-2 py-3"
        >
          {!hasAny ? (
            <ClosedDayState locale={locale} />
          ) : (
            <div className="space-y-3">
              {grouped.map(({ hour, slots: hourSlots }) => (
                <HourSection
                  key={hour}
                  hour={hour}
                  slots={hourSlots}
                  locale={locale}
                  onSlotClick={onSlotClick}
                />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ── Hour section ──────────────────────────────────────────────

function HourSection({
  hour,
  slots,
  locale,
  onSlotClick,
}: {
  hour: string;
  slots: ComputedSlot[];
  locale: string;
  onSlotClick?: (slot: ComputedSlot) => void;
}) {
  return (
    <div>
      {/* Hour label */}
      <div className="flex items-center gap-2 mb-1 px-1">
        <span className="text-[10px] text-amber-600 font-semibold tabular-nums tracking-widest">
          {hour}
        </span>
        <div className="flex-1 h-px bg-amber-100" />
      </div>
      {/* Slots in this hour */}
      <div className="space-y-0.5">
        {slots.map((slot) => {
          const timeLabel = fmtTime(new Date(slot.startAt));
          const label     = slot.status === 'booked' ? undefined : undefined; // customer names resolved by parent
          return (
            <SlotCell
              key={slot.startAt.toString()}
              slot={slot}
              timeLabel={timeLabel}
              onClick={onSlotClick}
            />
          );
        })}
      </div>
    </div>
  );
}

// ── Closed day ────────────────────────────────────────────────

function ClosedDayState({ locale }: { locale: string }) {
  const msgs: Record<string, string> = {
    es: 'Sin disponibilidad para este día',
    pt: 'Sem disponibilidade para este dia',
    en: 'No availability for this day',
  };
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center mb-4">
        <span className="text-xl">🗓</span>
      </div>
      <p className="font-cormorant text-base text-stone-500">
        {msgs[locale] ?? msgs['es']}
      </p>
    </div>
  );
}

// ── Grouping ──────────────────────────────────────────────────

function groupByHour(slots: ComputedSlot[]): { hour: string; slots: ComputedSlot[] }[] {
  const map = new Map<string, ComputedSlot[]>();
  for (const slot of slots) {
    const h = fmtTime(new Date(slot.startAt)).slice(0, 2) + ':00';
    const group = map.get(h) ?? [];
    group.push(slot);
    map.set(h, group);
  }
  return Array.from(map.entries()).map(([hour, slots]) => ({ hour, slots }));
}
