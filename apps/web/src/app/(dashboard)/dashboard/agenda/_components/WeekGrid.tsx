'use client';

import { useMemo } from 'react';
import { EventCard, PX_PER_MIN, GRID_START_HOUR } from './AppointmentSlot';
import type { CalendarEvent } from '@/domains/booking/calendar-service';

interface WeekGridProps {
  events:    CalendarEvent[];
  weekStart: Date;
  locale:    string;
}

const GRID_END_HOUR  = 21;   // exclusive — grid shows 08:00–21:00
const TOTAL_HOURS    = GRID_END_HOUR - GRID_START_HOUR;
const TOTAL_PX       = TOTAL_HOURS * 60 * PX_PER_MIN;  // 1560px
const HOUR_PX        = 60 * PX_PER_MIN;                // 120px

/** Build time labels: "08:00" … "21:00" */
const HOUR_LABELS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = GRID_START_HOUR + i;
  return `${String(h).padStart(2, '0')}:00`;
});

/** Group events by day-of-week (0=Mon … 6=Sun relative to weekStart). */
function groupByDay(events: CalendarEvent[], weekStart: Date): CalendarEvent[][] {
  const groups: CalendarEvent[][] = Array.from({ length: 7 }, () => []);
  for (const ev of events) {
    const start = new Date(ev.startAt);
    const diff  = Math.floor(
      (start.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diff >= 0 && diff < 7) groups[diff]!.push(ev);
  }
  return groups;
}

/**
 * Resolve overlapping events in a day into columns so they don't visually overlap.
 * Returns a map from eventId → { columnIndex, totalColumns }.
 */
function resolveColumns(dayEvents: CalendarEvent[]): Map<string, { col: number; total: number }> {
  const result = new Map<string, { col: number; total: number }>();
  if (dayEvents.length === 0) return result;

  // Sort by startAt
  const sorted = [...dayEvents].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  // Sweep-line overlap detection
  type Group = CalendarEvent[];
  const groups: Group[] = [];
  let currentGroup: Group = [];
  let maxEnd = -Infinity;

  for (const ev of sorted) {
    const s = new Date(ev.startAt).getTime();
    const e = new Date(ev.endAt).getTime();
    if (currentGroup.length === 0 || s < maxEnd) {
      currentGroup.push(ev);
      maxEnd = Math.max(maxEnd, e);
    } else {
      groups.push(currentGroup);
      currentGroup = [ev];
      maxEnd = e;
    }
  }
  if (currentGroup.length > 0) groups.push(currentGroup);

  for (const g of groups) {
    const n = g.length;
    g.forEach((ev, i) => result.set(ev.id, { col: i, total: n }));
  }

  return result;
}

function NowLine({ weekStart }: { weekStart: Date }) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStartLocal = new Date(weekStart);
  // day index 0=Mon
  const dayIndex = Math.floor(
    (today.getTime() - weekStartLocal.getTime()) / (1000 * 60 * 60 * 24)
  );
  if (dayIndex < 0 || dayIndex > 6) return null;

  const nowMin = now.getHours() * 60 + now.getMinutes() - GRID_START_HOUR * 60;
  if (nowMin < 0 || nowMin > TOTAL_HOURS * 60) return null;

  const top = nowMin * PX_PER_MIN;

  return (
    <div
      style={{ gridColumnStart: dayIndex + 2, top, position: 'absolute', left: 0, right: 0, zIndex: 20, pointerEvents: 'none' }}
      className="flex items-center"
    >
      <div className="w-2 h-2 rounded-full bg-red-500 -ml-1 flex-shrink-0" />
      <div className="flex-1 border-t border-red-400" />
    </div>
  );
}

export function WeekGrid({ events, weekStart, locale }: WeekGridProps) {
  const dayGroups = useMemo(() => groupByDay(events, weekStart), [events, weekStart]);

  return (
    <div className="hidden md:flex overflow-y-auto overflow-x-hidden" style={{ height: 'calc(100vh - 200px)' }}>
      {/* Hour gutter */}
      <div className="flex-shrink-0 w-14 relative" style={{ height: TOTAL_PX }}>
        {HOUR_LABELS.map((label, i) => (
          <div
            key={label}
            className="absolute right-2 text-[10px] text-stone-400 tabular-nums"
            style={{ top: i * HOUR_PX - 6 }}
          >
            {label}
          </div>
        ))}
      </div>

      {/* 7 day columns */}
      <div className="flex-1 grid grid-cols-7 border-l border-stone-100">
        {dayGroups.map((dayEvents, dayIdx) => {
          const colMap = resolveColumns(dayEvents);

          // Today highlight
          const colDate = new Date(weekStart);
          colDate.setUTCDate(colDate.getUTCDate() + dayIdx);
          const today = isToday(colDate);

          return (
            <div
              key={dayIdx}
              className={[
                'relative border-r border-stone-100',
                today ? 'bg-amber-50/20' : '',
              ].join(' ')}
              style={{ height: TOTAL_PX }}
            >
              {/* Hour grid lines */}
              {HOUR_LABELS.map((_, i) => (
                <div
                  key={i}
                  className="absolute left-0 right-0 border-t border-stone-100"
                  style={{ top: i * HOUR_PX }}
                />
              ))}

              {/* Now line (only in today's column) */}
              {today && <NowLineInColumn />}

              {/* Events */}
              {dayEvents.map((ev) => {
                const layout = colMap.get(ev.id) ?? { col: 0, total: 1 };
                return (
                  <EventCard
                    key={ev.id}
                    event={ev}
                    locale={locale}
                    columnIndex={layout.col}
                    totalColumns={layout.total}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NowLineInColumn() {
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes() - GRID_START_HOUR * 60;
  if (nowMin < 0 || nowMin > TOTAL_HOURS * 60) return null;
  const top = nowMin * PX_PER_MIN;
  return (
    <div
      className="absolute left-0 right-0 flex items-center z-20 pointer-events-none"
      style={{ top }}
    >
      <div className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
      <div className="flex-1 border-t border-red-400" />
    </div>
  );
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getUTCFullYear() === now.getFullYear() &&
         d.getUTCMonth()    === now.getMonth()    &&
         d.getUTCDate()     === now.getDate();
}
