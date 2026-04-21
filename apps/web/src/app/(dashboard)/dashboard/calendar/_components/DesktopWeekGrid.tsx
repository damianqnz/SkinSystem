'use client';

import { cn } from '@/shared/lib/utils';
import { HOUR_LABELS, HOUR_PX, TOTAL_PX } from './week-constants';
import { DesktopWeekColumn } from './DesktopWeekColumn';
import { isToday, DAY_LABELS } from './week-utils';
import type { WeekDaySer } from './week-utils';

// ── Props ─────────────────────────────────────────────────────

interface DesktopWeekGridProps {
  weekDays:            WeekDaySer[];
  locale:              string;
  onHourClick:         (dateIso: string, time: string, isBusinessHour: boolean) => void;
  onAppointmentClick?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────

export function DesktopWeekGrid({ weekDays, locale, onHourClick, onAppointmentClick }: DesktopWeekGridProps) {
  const days = DAY_LABELS[locale] ?? DAY_LABELS.es!;

  return (
    <div className="hidden md:flex flex-col h-full bg-white min-h-0">

      {/* ── Sticky day-name header ─────────────────────────── */}
      <div className="flex border-b border-stone-100 shrink-0 bg-white/95 backdrop-blur-sm">
        <div className="w-14 shrink-0" />
        {weekDays.map((day, i) => {
          const d     = new Date(day.dateIso + 'T00:00:00Z');
          const today = isToday(d);
          return (
            <div key={day.dateIso}
                 className={cn(
                   'flex-1 p-2 text-center border-l border-stone-100',
                   today && 'bg-amber-50/40',
                 )}>
              <p className={cn('text-xs font-semibold', today ? 'text-amber-600' : 'text-stone-500')}>
                {days[i]}
              </p>
              <p className={cn('text-[11px] tabular-nums', today ? 'text-amber-500' : 'text-stone-400')}>
                {d.getUTCDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Scrollable event grid ──────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex min-h-0">

        {/* Hour gutter */}
        <div className="w-14 shrink-0 relative" style={{ height: TOTAL_PX }}>
          {HOUR_LABELS.map((label, i) => (
            <div key={label}
                 className="absolute right-2 text-[10px] text-stone-400 tabular-nums"
                 style={{ top: i * HOUR_PX - 6 }}>
              {label}
            </div>
          ))}
        </div>

        {/* 7 columns */}
        <div className="flex-1 grid grid-cols-7 border-l border-stone-100">
          {weekDays.map((day, i) => (
            <DesktopWeekColumn
              key={day.dateIso}
              data={day}
              dayIdx={i}
              locale={locale}
              onHourClick={onHourClick}
              onAppointmentClick={onAppointmentClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
