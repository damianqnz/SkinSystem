'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';

interface CalendarDayNavProps {
  date:       Date;
  locale:     string;
  services:   { id: string; name: string }[];
  serviceId:  string;
}

const DAY_NAMES: Record<string, string[]> = {
  es: ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'],
  pt: ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'],
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
};

const MONTH_NAMES: Record<string, string[]> = {
  es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  pt: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

function fmtDate(d: Date, locale: string): { dayName: string; full: string } {
  const days   = DAY_NAMES[locale]  ?? DAY_NAMES['es']!;
  const months = MONTH_NAMES[locale] ?? MONTH_NAMES['es']!;
  return {
    dayName: days[d.getUTCDay()]!,
    full:    `${d.getUTCDate()} ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
  };
}

function isToday(d: Date): boolean {
  const now = new Date();
  return d.getUTCFullYear() === now.getFullYear() &&
         d.getUTCMonth()    === now.getMonth()    &&
         d.getUTCDate()     === now.getDate();
}

export function CalendarDayNav({
  date,
  locale,
  services,
  serviceId,
}: CalendarDayNavProps) {
  const router  = useRouter();
  const path    = usePathname();
  const params  = useSearchParams();

  function navigate(delta: number) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + delta);
    const sp = new URLSearchParams(params.toString());
    sp.set('date', d.toISOString().slice(0, 10));
    router.push(`${path}?${sp.toString()}`);
  }

  function changeService(id: string) {
    const sp = new URLSearchParams(params.toString());
    sp.set('serviceId', id);
    router.push(`${path}?${sp.toString()}`);
  }

  function goToday() {
    const sp = new URLSearchParams(params.toString());
    sp.delete('date');
    router.push(`${path}?${sp.toString()}`);
  }

  const today    = isToday(date);
  const { dayName, full } = fmtDate(date, locale);

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-100">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Today button */}
        <button
          onClick={goToday}
          disabled={today}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-colors"
        >
          <CalendarDays size={12} />
          Hoy
        </button>

        {/* Date nav */}
        <div className="flex items-center gap-2 flex-1 justify-center">
          <button
            onClick={() => navigate(-1)}
            aria-label="Día anterior"
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"
          >
            <ChevronLeft size={15} />
          </button>

          <div className="text-center min-w-[160px]">
            <p className={['text-sm font-semibold', today ? 'text-amber-600' : 'text-stone-800'].join(' ')}>
              {dayName}
            </p>
            <p className="text-[11px] text-stone-400 tabular-nums">{full}</p>
          </div>

          <button
            onClick={() => navigate(1)}
            aria-label="Día siguiente"
            className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Spacer to balance layout */}
        <div className="w-[60px]" />
      </div>

      {/* Service selector */}
      {services.length > 1 && (
        <div className="flex gap-1.5 px-4 pb-3 overflow-x-auto no-scrollbar">
          {services.map((svc) => (
            <button
              key={svc.id}
              onClick={() => changeService(svc.id)}
              className={[
                'flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium transition-colors',
                svc.id === serviceId
                  ? 'bg-stone-800 text-white'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200',
              ].join(' ')}
            >
              {svc.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
