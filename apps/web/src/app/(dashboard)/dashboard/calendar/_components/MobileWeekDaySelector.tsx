'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { isToday } from './week-utils';
import { MONDAY_FIRST_DAY_KEYS } from '@/i18n/calendar-keys';
import type { WeekDaySer } from './week-utils';

// ── Props ─────────────────────────────────────────────────────

interface MobileWeekDaySelectorProps {
  weekDays:    WeekDaySer[];
  selectedIdx: number;
  onChange:    (idx: number) => void;
}

// ── Component ─────────────────────────────────────────────────

export function MobileWeekDaySelector({ weekDays, selectedIdx, onChange }: MobileWeekDaySelectorProps) {
  const tCal  = useTranslations('calendar');
  const short = MONDAY_FIRST_DAY_KEYS.map((k) => tCal(`days.${k}`).slice(0, 3));

  return (
    <div className="flex overflow-x-auto no-scrollbar border-b border-stone-100 bg-white shrink-0">
      {weekDays.map((day, i) => {
        const d      = new Date(day.dateIso + 'T00:00:00Z');
        const today  = isToday(d);
        const active = selectedIdx === i;

        return (
          <button
            key={day.dateIso}
            onClick={() => onChange(i)}
            className={cn(
              'flex flex-col items-center gap-0.5 min-w-[44px] px-2 py-2.5 flex-1',
              'transition-colors duration-75 focus:outline-none focus-visible:ring-1',
              'focus-visible:ring-[#D4AF37]/50',
              active
                ? 'border-b-2 border-[#D4AF37] text-stone-800'
                : 'border-b-2 border-transparent text-stone-400 hover:text-stone-600',
            )}
          >
            <span className="text-[10px] uppercase tracking-wider">{short[i]}</span>
            <span
              className={cn(
                'text-sm font-medium tabular-nums w-7 h-7 flex items-center justify-center rounded-full',
                today && active  && 'bg-[#D4AF37] text-white',
                today && !active && 'bg-amber-100 text-amber-700',
                !today && active && 'bg-stone-100 text-stone-800',
              )}
            >
              {d.getUTCDate()}
            </span>
          </button>
        );
      })}
    </div>
  );
}
