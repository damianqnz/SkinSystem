'use client';

import { useMemo } from 'react';
import { DayEventBlock } from './DayEventBlock';
import { HOUR_PX, TOTAL_PX, PX_PER_MIN } from './week-constants';
import type { WeekDaySer } from './week-utils';

// ── Helpers ───────────────────────────────────────────────────

function padHour(h: number): string   { return `${String(h).padStart(2, '0')}:00`; }
function parseHour(t: string): number { return parseInt(t.split(':')[0] ?? '0', 10); }

// ── Props ─────────────────────────────────────────────────────

interface DesktopWeekColumnProps {
  data:                WeekDaySer;
  dayIdx:              number;
  locale:              string;
  onHourClick:         (dateIso: string, time: string, isBusinessHour: boolean) => void;
  onAppointmentClick?: (id: string) => void;
}

// ── Component ─────────────────────────────────────────────────

export function DesktopWeekColumn({ data, locale, onHourClick, onAppointmentClick }: DesktopWeekColumnProps) {
  const busStart = useMemo(() => parseHour(data.businessStart), [data.businessStart]);
  const busEnd   = useMemo(() => parseHour(data.businessEnd),   [data.businessEnd]);

  return (
    <div className="relative border-r border-stone-100 last:border-r-0" style={{ height: TOTAL_PX }}>

      {/* ── Hour lines ─────────────────────────────────────── */}
      {Array.from({ length: 24 }, (_, i) => (
        <div key={i} className="absolute inset-x-0 border-t border-stone-100/60 pointer-events-none"
             style={{ top: i * HOUR_PX }} />
      ))}

      {/* ── Clickable hour rows ────────────────────────────── */}
      {Array.from({ length: 24 }, (_, h) => {
        const isBiz = data.isOpen && h >= busStart && h < busEnd;
        return (
          <div
            key={`r${h}`}
            style={{ position: 'absolute', top: h * HOUR_PX, height: HOUR_PX, left: 0, right: 0 }}
            className={[
              'cursor-pointer transition-colors duration-75',
              isBiz ? 'hover:bg-[rgba(212,175,55,0.04)]' : 'bg-stone-100/10 hover:bg-stone-100/20',
            ].join(' ')}
            onClick={() => onHourClick(data.dateIso, padHour(h), isBiz)}
          />
        );
      })}

      {/* ── Appointments ───────────────────────────────────── */}
      {data.appointments.map((a) => {
        const start  = new Date(a.startAt);
        const end    = new Date(a.endAt);
        const top    = (start.getUTCHours() * 60 + start.getUTCMinutes()) * PX_PER_MIN;
        const height = Math.max(((end.getTime() - start.getTime()) / 60000) * PX_PER_MIN, 20);
        return (
          <div key={a.id} style={{ position: 'absolute', top, height, left: 2, right: 2, zIndex: 10 }}
               className="overflow-hidden">
            <DayEventBlock
              type="appointment"
              label={`${a.customerName} · ${a.serviceName[locale] ?? Object.values(a.serviceName)[0] ?? ''}`}
              timeRange={`${a.startAt.slice(11, 16)} – ${a.endAt.slice(11, 16)}`}
              variant={a.status}
              appointmentId={a.id}
              onAppointmentClick={onAppointmentClick}
            />
          </div>
        );
      })}

      {/* ── Blocked intervals ──────────────────────────────── */}
      {data.blockedIntervals.map((b) => {
        const start  = new Date(b.startAt);
        const end    = new Date(b.endAt);
        const top    = (start.getUTCHours() * 60 + start.getUTCMinutes()) * PX_PER_MIN;
        const height = Math.max(((end.getTime() - start.getTime()) / 60000) * PX_PER_MIN, 20);
        return (
          <div key={b.id} style={{ position: 'absolute', top, height, left: 2, right: 2, zIndex: 10 }}
               className="overflow-hidden">
            <DayEventBlock
              type="blocked"
              label={b.reason}
              timeRange={`${b.startAt.slice(11, 16)} – ${b.endAt.slice(11, 16)}`}
              variant="blocked"
            />
          </div>
        );
      })}
    </div>
  );
}
