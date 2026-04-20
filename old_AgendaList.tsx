'use client';

import { useMemo } from 'react';
import { Clock, User, Scissors } from 'lucide-react';
import type { CalendarEvent } from '@/domains/booking/calendar-service';

interface AgendaListProps {
  events:    CalendarEvent[];
  weekStart: Date;
  locale:    string;
}

const DAY_LABELS: Record<string, string[]> = {
  es: ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],
  pt: ['Segunda','Terça','Quarta','Quinta','Sexta','Sábado','Domingo'],
  en: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
};

const MONTH_LABELS: Record<string, string[]> = {
  es: ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'],
  pt: ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

const STATUS_CONFIG: Record<string, { label: Record<string, string>; dot: string }> = {
  pending:     { label: { es: 'Pendiente',   pt: 'Pendente',    en: 'Pending'    }, dot: 'bg-amber-400' },
  confirmed:   { label: { es: 'Confirmada',  pt: 'Confirmado',  en: 'Confirmed'  }, dot: 'bg-sky-400'   },
  in_progress: { label: { es: 'En curso',    pt: 'Em curso',    en: 'In progress'}, dot: 'bg-yellow-400'},
  completed:   { label: { es: 'Completada',  pt: 'Concluído',   en: 'Completed'  }, dot: 'bg-emerald-400'},
  cancelled:   { label: { es: 'Cancelada',   pt: 'Cancelado',   en: 'Cancelled'  }, dot: 'bg-slate-400' },
  no_show:     { label: { es: 'No asistió',  pt: 'Não compareceu', en: 'No show' }, dot: 'bg-red-400'  },
};

type DayGroup = {
  dayLabel: string;
  dateLabel: string;
  isToday: boolean;
  events: CalendarEvent[];
};

function groupEventsByDay(events: CalendarEvent[], weekStart: Date, locale: string): DayGroup[] {
  const days    = DAY_LABELS[locale]  ?? DAY_LABELS['es']!;
  const months  = MONTH_LABELS[locale] ?? MONTH_LABELS['es']!;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);

    const today = checkToday(d);

    const dayEvents = events.filter((ev) => {
      const s = new Date(ev.startAt);
      return (
        s.getUTCFullYear() === d.getUTCFullYear() &&
        s.getUTCMonth()    === d.getUTCMonth()    &&
        s.getUTCDate()     === d.getUTCDate()
      );
    }).sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

    return {
      dayLabel:  days[i]!,
      dateLabel: `${d.getUTCDate()} ${months[d.getUTCMonth()]}`,
      isToday:   today,
      events:    dayEvents,
    };
  });
}

function checkToday(d: Date): boolean {
  const now = new Date();
  return d.getUTCFullYear() === now.getFullYear() &&
         d.getUTCMonth()    === now.getMonth()    &&
         d.getUTCDate()     === now.getDate();
}

export function AgendaList({ events, weekStart, locale }: AgendaListProps) {
  const groups = useMemo(
    () => groupEventsByDay(events, weekStart, locale),
    [events, weekStart, locale]
  );

  const hasAny = groups.some((g) => g.events.length > 0);

  if (!hasAny) {
    return (
      <div className="md:hidden flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center mb-4">
          <Scissors size={22} className="text-stone-400" />
        </div>
        <p className="font-cormorant text-lg text-stone-600">Sin citas esta semana</p>
        <p className="text-xs text-stone-400 mt-1">Las citas aparecerán aquí cuando se agenden.</p>
      </div>
    );
  }

  return (
    <div className="md:hidden divide-y divide-stone-100">
      {groups.map((group, i) => (
        <DaySection key={i} group={group} locale={locale} />
      ))}
    </div>
  );
}

function DaySection({ group, locale }: { group: DayGroup; locale: string }) {
  return (
    <div>
      {/* Day header */}
      <div className={[
        'sticky top-[120px] z-10 px-4 py-2 flex items-baseline gap-2 border-b border-stone-100',
        group.isToday ? 'bg-amber-50' : 'bg-stone-50/80 backdrop-blur-sm',
      ].join(' ')}>
        <span className={['text-sm font-semibold', group.isToday ? 'text-amber-700' : 'text-stone-700'].join(' ')}>
          {group.dayLabel}
        </span>
        <span className="text-xs text-stone-400">{group.dateLabel}</span>
        {group.isToday && (
          <span className="ml-auto text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide">
            Hoy
          </span>
        )}
      </div>

      {/* Events or empty */}
      {group.events.length === 0 ? (
        <div className="px-4 py-3">
          <p className="text-xs text-stone-300 italic">Sin citas</p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-50">
          {group.events.map((ev) => (
            <AgendaEventRow key={ev.id} event={ev} locale={locale} />
          ))}
        </ul>
      )}
    </div>
  );
}

function AgendaEventRow({ event, locale }: { event: CalendarEvent; locale: string }) {
  const start = new Date(event.startAt);
  const end   = new Date(event.endAt);

  const timeStr = `${start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} – ${end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

  const serviceName =
    (event.serviceName?.[locale] as string | undefined) ??
    (event.serviceName?.['es']   as string | undefined) ??
    Object.values(event.serviceName ?? {})[0] ??
    '—';

  const statusConf = STATUS_CONFIG[event.status] ?? STATUS_CONFIG['pending']!;
  const statusLabel = (statusConf.label[locale] ?? statusConf.label['es'])!;

  const amountFmt = new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(event.totalCents / 100);

  return (
    <li className="px-4 py-3.5 flex items-start gap-3 hover:bg-stone-50 active:bg-stone-100 transition-colors cursor-pointer">
      {/* Time column */}
      <div className="flex-shrink-0 w-14 text-right">
        <p className="text-[11px] font-medium text-stone-500 tabular-nums leading-tight">
          {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </p>
        <p className="text-[10px] text-stone-300 tabular-nums">
          {end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </p>
      </div>

      {/* Color accent */}
      <div className={['w-0.5 self-stretch rounded-full flex-shrink-0', statusConf.dot].join(' ')} />

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 truncate">{event.customerName}</p>
        <p className="text-xs text-stone-500 truncate mt-0.5">{serviceName}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-stone-400">
            <Clock size={10} />
            {event.durationMinutes}min
          </span>
          <span className={['text-[10px] font-medium px-1.5 py-0.5 rounded-full',
            event.status === 'completed'   ? 'bg-emerald-100 text-emerald-700' :
            event.status === 'cancelled'   ? 'bg-slate-100 text-slate-500'     :
            event.status === 'confirmed'   ? 'bg-sky-100 text-sky-700'         :
            event.status === 'in_progress' ? 'bg-yellow-100 text-yellow-700'   :
            event.status === 'no_show'     ? 'bg-red-100 text-red-600'         :
            'bg-amber-100 text-amber-700'
          ].join(' ')}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Price */}
      <div className="flex-shrink-0 text-right">
        <p className="text-xs font-medium text-stone-600 tabular-nums">{amountFmt}</p>
      </div>
    </li>
  );
}
