'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { getWeekStart } from '@/domains/booking/calendar-service';

interface CalendarHeaderProps {
  weekStart:   Date;
  locale:      string;
}

const DAY_LABELS: Record<string, string[]> = {
  es: ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],
  pt: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'],
  en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
};

const MONTH_LABELS: Record<string, string[]> = {
  es: ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'],
  pt: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'],
  en: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
};

function fmtWeekRange(weekStart: Date, locale: string): string {
  const months = MONTH_LABELS[locale] ?? MONTH_LABELS['es']!;
  const end    = new Date(weekStart);
  end.setUTCDate(end.getUTCDate() + 6);

  const d1 = weekStart.getUTCDate();
  const d2 = end.getUTCDate();
  const m1 = months[weekStart.getUTCMonth()]!;
  const m2 = months[end.getUTCMonth()]!;

  if (m1 === m2) return `${d1}–${d2} ${m1} ${end.getUTCFullYear()}`;
  return `${d1} ${m1} – ${d2} ${m2} ${end.getUTCFullYear()}`;
}

export function CalendarHeader({ weekStart, locale }: CalendarHeaderProps) {
  const router     = useRouter();
  const pathname   = usePathname();
  const params     = useSearchParams();
  const days       = DAY_LABELS[locale] ?? DAY_LABELS['es']!;

  function navigate(deltaWeeks: number) {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + deltaWeeks * 7);
    const iso = d.toISOString().slice(0, 10);
    const sp  = new URLSearchParams(params.toString());
    sp.set('week', iso);
    router.push(`${pathname}?${sp.toString()}`);
  }

  function goToday() {
    const sp = new URLSearchParams(params.toString());
    sp.delete('week');
    router.push(`${pathname}?${sp.toString()}`);
  }

  // Day headers with date numbers
  const dayHeaders = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return { label: days[i]!, date: d.getUTCDate(), isToday: isToday(d) };
  });

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200/60">
      {/* Toolbar row */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={goToday}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-600 border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
          >
            <Calendar size={13} />
            Hoy
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            aria-label="Semana anterior"
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm font-medium text-stone-700 min-w-[160px] text-center tabular-nums">
            {fmtWeekRange(weekStart, locale)}
          </span>

          <button
            onClick={() => navigate(1)}
            aria-label="Semana siguiente"
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>

        {/* Placeholder: add appointment button */}
        <div className="w-[60px]" />
      </div>

      {/* Day labels row — desktop only */}
      <div className="hidden md:grid grid-cols-[56px_repeat(7,1fr)] border-t border-stone-100">
        <div />
        {dayHeaders.map((d, i) => (
          <div
            key={i}
            className={[
              'py-2 text-center border-l border-stone-100',
              d.isToday ? 'bg-amber-50/60' : '',
            ].join(' ')}
          >
            <p className={['text-[10px] uppercase tracking-widest', d.isToday ? 'text-amber-600' : 'text-stone-400'].join(' ')}>
              {d.label}
            </p>
            <p className={[
              'text-sm font-semibold mt-0.5',
              d.isToday
                ? 'w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center mx-auto'
                : 'text-stone-700',
            ].join(' ')}>
              {d.date}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getUTCFullYear() === now.getFullYear() &&
         d.getUTCMonth()    === now.getMonth()    &&
         d.getUTCDate()     === now.getDate();
}
