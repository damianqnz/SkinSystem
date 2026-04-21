'use client';

import { useRef, useMemo } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { DayEventBlock } from './DayEventBlock';

gsap.registerPlugin(useGSAP);

// ── Serialized types (RSC → Client boundary) ──────────────────

export type DayApptSer = {
  id: string; startAt: string; endAt: string;
  status: string; customerName: string;
  serviceName: Record<string, string>;
};

export type DayBlockSer = {
  id: string; startAt: string; endAt: string; reason: string;
};

export type DayViewSer = {
  businessStart: string;  // "HH:MM:SS"
  businessEnd:   string;
  isOpen:        boolean;
  appointments:     DayApptSer[];
  blockedIntervals: DayBlockSer[];
};

// ── Helpers ───────────────────────────────────────────────────

const HOURS = Array.from({ length: 24 }, (_, i) => i);
function parseHour(t: string): number { return parseInt(t.split(':')[0] ?? '0', 10); }
function padHour(h: number):  string  { return `${String(h).padStart(2, '0')}:00`; }
const CLOSED: Record<string, string> = {
  es: 'Día cerrado — sin horario de trabajo',
  pt: 'Dia fechado — sem horário de trabalho',
  en: 'Closed day — no working hours',
};

interface DayTimeGridProps {
  data:                 DayViewSer;
  locale:               string;
  onHourClick:          (time: string, isBusinessHour: boolean) => void;
  onAppointmentClick?:  (id: string) => void;
}

// ── Component ────────────────────────────────────────────────

export function DayTimeGrid({ data, locale, onHourClick, onAppointmentClick }: DayTimeGridProps) {
  const ref      = useRef<HTMLDivElement>(null);
  const busStart = useMemo(() => parseHour(data.businessStart), [data.businessStart]);
  const busEnd   = useMemo(() => parseHour(data.businessEnd),   [data.businessEnd]);

  useGSAP(() => {
    gsap.from('.hour-row', { opacity: 0, y: 5, stagger: 0.01, duration: 0.25, ease: 'power2.out', clearProps: 'all' });
  }, { scope: ref, dependencies: [data.businessStart] });

  if (!data.isOpen) {
    return (
      <div className="flex items-center justify-center py-24 px-4">
        <p className="font-cormorant text-base text-stone-400 text-center">
          {CLOSED[locale] ?? CLOSED.es}
        </p>
      </div>
    );
  }

  return (
    <div ref={ref} className="flex-1 overflow-y-auto select-none pb-6">
      {HOURS.map((hour) => {
        const isBiz  = hour >= busStart && hour < busEnd;
        const appts  = data.appointments.filter(a      => new Date(a.startAt).getUTCHours() === hour);
        const blocks = data.blockedIntervals.filter(b  => new Date(b.startAt).getUTCHours() === hour);
        return (
          <HourRow
            key={hour}
            hour={hour}
            isBusinessHour={isBiz}
            appointments={appts}
            blockedIntervals={blocks}
            locale={locale}
            onClick={() => onHourClick(padHour(hour), isBiz)}
            onAppointmentClick={onAppointmentClick}
          />
        );
      })}
    </div>
  );
}

// ── HourRow ───────────────────────────────────────────────────

function HourRow({
  hour, isBusinessHour, appointments, blockedIntervals, locale, onClick, onAppointmentClick,
}: {
  hour: number; isBusinessHour: boolean;
  appointments: DayApptSer[]; blockedIntervals: DayBlockSer[];
  locale: string; onClick: () => void;
  onAppointmentClick?: (id: string) => void;
}) {
  const hasEvents = appointments.length > 0 || blockedIntervals.length > 0;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={padHour(hour)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className={[
        'hour-row flex min-h-[56px] border-b border-stone-100 cursor-pointer group',
        'transition-colors duration-100 focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4AF37]/50',
        isBusinessHour
          ? 'bg-stone-50/60 hover:bg-[rgba(212,175,55,0.025)]'
          : 'bg-stone-200/15 hover:bg-stone-200/25',
      ].join(' ')}
      onClick={onClick}
    >
      <div className="w-14 flex-shrink-0 pt-2 pr-3 text-right">
        <span className="text-[11px] text-stone-400 font-medium tabular-nums">{padHour(hour)}</span>
      </div>
      <div className="flex-1 pl-2 py-1.5 space-y-1 border-l border-stone-100/80">
        {appointments.map((a) => (
          <DayEventBlock
            key={a.id}
            type="appointment"
            label={`${a.customerName} · ${(a.serviceName[locale] ?? Object.values(a.serviceName)[0]) ?? ''}`}
            timeRange={`${a.startAt.slice(11, 16)} – ${a.endAt.slice(11, 16)}`}
            variant={a.status}
            appointmentId={a.id}
            onAppointmentClick={onAppointmentClick}
          />
        ))}
        {blockedIntervals.map((b) => (
          <DayEventBlock
            key={b.id}
            type="blocked"
            label={b.reason}
            timeRange={`${b.startAt.slice(11, 16)} – ${b.endAt.slice(11, 16)}`}
            variant="blocked"
          />
        ))}
        {!hasEvents && isBusinessHour && (
          <div className="h-5 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="h-full w-0.5 bg-[#D4AF37]/30 rounded-full" />
          </div>
        )}
      </div>
    </div>
  );
}
