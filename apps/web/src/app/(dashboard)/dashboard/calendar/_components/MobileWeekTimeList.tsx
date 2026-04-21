'use client';

import { DayEventBlock } from './DayEventBlock';
import type { WeekDaySer } from './week-utils';

// ── Helpers ───────────────────────────────────────────────────

const CLOSED: Record<string, string> = {
  es: 'Día cerrado — sin horario de trabajo',
  pt: 'Dia fechado — sem horário de trabalho',
  en: 'Closed day — no working hours',
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
function padHour(h: number): string   { return `${String(h).padStart(2, '0')}:00`; }
function parseHour(t: string): number { return parseInt(t.split(':')[0] ?? '0', 10); }

// ── Props ─────────────────────────────────────────────────────

interface MobileWeekTimeListProps {
  day:                 WeekDaySer;
  locale:              string;
  onHourClick:         (dateIso: string, time: string, isBusinessHour: boolean) => void;
  onAppointmentClick?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────

export function MobileWeekTimeList({ day, locale, onHourClick, onAppointmentClick }: MobileWeekTimeListProps) {
  if (!day.isOpen) {
    return (
      <div className="flex-1 flex items-center justify-center py-16 px-4 text-center">
        <p className="font-cormorant text-base text-stone-400">{CLOSED[locale] ?? CLOSED.es}</p>
      </div>
    );
  }

  const busStart = parseHour(day.businessStart);
  const busEnd   = parseHour(day.businessEnd);

  return (
    <div className="flex-1 overflow-y-auto select-none pb-6">
      {HOURS.map((hour) => {
        const isBiz   = hour >= busStart && hour < busEnd;
        const appts   = day.appointments.filter(a => new Date(a.startAt).getUTCHours() === hour);
        const blocks  = day.blockedIntervals.filter(b => new Date(b.startAt).getUTCHours() === hour);
        const hasEvts = appts.length > 0 || blocks.length > 0;

        return (
          <div
            key={hour}
            role="button"
            tabIndex={0}
            onClick={() => onHourClick(day.dateIso, padHour(hour), isBiz)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') onHourClick(day.dateIso, padHour(hour), isBiz);
            }}
            className={[
              'flex min-h-[52px] border-b border-stone-100 cursor-pointer',
              'transition-colors duration-100 focus:outline-none',
              'focus-visible:ring-1 focus-visible:ring-[#D4AF37]/50',
              isBiz ? 'bg-stone-50/60 hover:bg-[rgba(212,175,55,0.025)]'
                    : 'bg-stone-200/15 hover:bg-stone-200/25',
            ].join(' ')}
          >
            <div className="w-14 shrink-0 pt-2 pr-3 text-right">
              <span className="text-[11px] text-stone-400 font-medium tabular-nums">{padHour(hour)}</span>
            </div>
            <div className="flex-1 pl-2 py-1.5 space-y-1 border-l border-stone-100/80">
              {appts.map((a) => (
                <DayEventBlock key={a.id} type="appointment"
                  label={`${a.customerName} · ${a.serviceName[locale] ?? Object.values(a.serviceName)[0] ?? ''}`}
                  timeRange={`${a.startAt.slice(11, 16)} – ${a.endAt.slice(11, 16)}`}
                  variant={a.status}
                  appointmentId={a.id}
                  onAppointmentClick={onAppointmentClick} />
              ))}
              {blocks.map((b) => (
                <DayEventBlock key={b.id} type="blocked"
                  label={b.reason}
                  timeRange={`${b.startAt.slice(11, 16)} – ${b.endAt.slice(11, 16)}`}
                  variant="blocked" />
              ))}
              {!hasEvts && isBiz && (
                <div className="h-5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="h-full w-0.5 bg-[#D4AF37]/30 rounded-full" />
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
