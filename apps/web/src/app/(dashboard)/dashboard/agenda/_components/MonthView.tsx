'use client';

import { useMemo } from 'react';
import { cn } from '@/shared/lib/utils';
import { EventChip } from './EventChip';

// ── Types ──────────────────────────────────────────────────────────

export type SerializedEvent = {
  id:           string;
  customerName: string;
  serviceName:  Record<string, string>;
  serviceColor: string | null;
  status:       string;
  /** ISO string — re-hydrated on the client */
  startIso:     string;
};

interface MonthViewProps {
  /** ISO date (YYYY-MM-DD) of the first visible cell (Monday on/before the 1st). */
  gridStartIso:  string;
  /** ISO date of the first day of the displayed month. */
  monthStartIso: string;
  events:        SerializedEvent[];
  locale:        string;
}

// ── Day labels ─────────────────────────────────────────────────────

const DAY_LABELS: Record<string, string[]> = {
  es: ['Lun.','Mar.','Mié.','Jue.','Vie.','Sáb.','Dom.'],
  pt: ['Seg.','Ter.','Qua.','Qui.','Sex.','Sáb.','Dom.'],
  en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
};

// ── Helpers ────────────────────────────────────────────────────────

function isoDateUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function isSameUTCDay(a: Date, b: Date): boolean {
  return a.getUTCFullYear() === b.getUTCFullYear()
      && a.getUTCMonth()    === b.getUTCMonth()
      && a.getUTCDate()     === b.getUTCDate();
}

function todayUtcMidnight(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}

// ── Component ──────────────────────────────────────────────────────

const MAX_EVENTS_PER_CELL = 3;

export function MonthView({ gridStartIso, monthStartIso, events, locale }: MonthViewProps) {
  const gridStart  = useMemo(() => new Date(gridStartIso  + 'T00:00:00Z'), [gridStartIso]);
  const monthStart = useMemo(() => new Date(monthStartIso + 'T00:00:00Z'), [monthStartIso]);
  const today      = useMemo(() => todayUtcMidnight(), []);
  const days       = DAY_LABELS[locale] ?? DAY_LABELS.es!;

  // Generate 42 cells (6 weeks × 7 days)
  const cells = useMemo(() => {
    return Array.from({ length: 42 }, (_, i) => {
      const date = new Date(gridStart);
      date.setUTCDate(date.getUTCDate() + i);
      return date;
    });
  }, [gridStart]);

  // Group events by ISO date (YYYY-MM-DD) once
  const eventsByDay = useMemo(() => {
    const map = new Map<string, SerializedEvent[]>();
    for (const ev of events) {
      const key = ev.startIso.slice(0, 10);
      const arr = map.get(key) ?? [];
      arr.push(ev);
      map.set(key, arr);
    }
    return map;
  }, [events]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-(--color-spa-bg)">
      {/* ── Day-of-week header row ──────────────────────────────── */}
      <div className="grid grid-cols-7 border-b border-spa-border bg-white shrink-0">
        {days.map((d, i) => (
          <div
            key={i}
            className="px-3 py-2 text-[11px] uppercase tracking-wider text-spa-muted text-left border-r border-spa-border last:border-r-0"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            {d}
          </div>
        ))}
      </div>

      {/* ── 6×7 grid ───────────────────────────────────────────── */}
      <div
        className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0 overflow-y-auto no-scrollbar"
        role="grid"
        aria-label="Vista mensal do calendário"
      >
        {cells.map((date) => {
          const inMonth   = date.getUTCMonth() === monthStart.getUTCMonth();
          const isToday   = isSameUTCDay(date, today);
          const dayKey    = isoDateUTC(date);
          const dayEvents = eventsByDay.get(dayKey) ?? [];
          const visible   = dayEvents.slice(0, MAX_EVENTS_PER_CELL);
          const overflow  = dayEvents.length - visible.length;

          return (
            <div
              key={dayKey}
              role="gridcell"
              className={cn(
                'min-h-[110px] flex flex-col gap-1 p-2',
                'border-r border-b border-spa-border last:border-r-0',
                inMonth ? 'bg-white' : 'bg-stone-50/40',
                'hover:bg-stone-50/80 transition-colors duration-75',
              )}
            >
              {/* Day number */}
              <div className="flex items-start justify-between mb-0.5">
                {date.getUTCDate() === 1 && !isToday ? (
                  <span
                    className="text-[12px] tabular-nums text-(--color-spa-stone)"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {date.getUTCDate()} {locale === 'pt' ? 'Abr' : locale === 'en' ? 'Apr' : 'Abr'}
                  </span>
                ) : isToday ? (
                  <span
                    className="inline-flex items-center justify-center w-6 h-6 text-[11px] tabular-nums font-medium rounded-full bg-(--color-spa-stone) text-white"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {date.getUTCDate()}
                  </span>
                ) : (
                  <span
                    className={cn(
                      'text-[12px] tabular-nums',
                      inMonth ? 'text-(--color-spa-stone)' : 'text-stone-300',
                    )}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {date.getUTCDate()}
                  </span>
                )}
              </div>

              {/* Events */}
              <div className="flex flex-col gap-0.5">
                {visible.map((ev) => (
                  <EventChip
                    key={ev.id}
                    startAt={new Date(ev.startIso)}
                    customerName={ev.customerName}
                    serviceColor={ev.serviceColor}
                    status={ev.status}
                    locale={locale}
                  />
                ))}
                {overflow > 0 && (
                  <span
                    className="text-[10px] uppercase tracking-wider text-spa-muted px-1"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    +{overflow} {locale === 'pt' ? 'mais' : locale === 'en' ? 'more' : 'más'}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
