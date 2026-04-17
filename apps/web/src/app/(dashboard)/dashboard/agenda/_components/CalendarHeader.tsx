'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { ViewSwitcher, type CalendarView } from './ViewSwitcher';

interface CalendarHeaderProps {
  /** First day of the displayed month (UTC) */
  monthStart: Date;
  locale:     string;
  view:       CalendarView;
}

const MONTH_LABELS: Record<string, string[]> = {
  es: ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'],
  pt: ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
};

const TODAY_LABEL: Record<string, string> = { es: 'Hoy', pt: 'Hoje', en: 'Today' };

function shiftMonthIso(monthStart: Date, delta: number): string {
  const d = new Date(monthStart);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}

export function CalendarHeader({ monthStart, locale, view }: CalendarHeaderProps) {
  const pathname = usePathname();
  const params   = useSearchParams();

  const buildHref = (monthIso?: string) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (monthIso) sp.set('month', monthIso);
    else          sp.delete('month');
    return `${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
  };

  const months   = MONTH_LABELS[locale] ?? MONTH_LABELS.es!;
  const monthLbl = months[monthStart.getUTCMonth()];
  const yearLbl  = monthStart.getUTCFullYear();

  return (
    <header className="h-14 px-5 flex items-center gap-3 border-b border-spa-border bg-white/85 backdrop-blur-md shrink-0">
      {/* Left — view dropdown */}
      <ViewSwitcher current={view} />

      {/* Center — month navigation */}
      <div className="flex-1 flex items-center justify-center gap-3">
        <Link
          href={buildHref(shiftMonthIso(monthStart, -1))}
          aria-label="Mês anterior"
          className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
          scroll={false}
        >
          <ChevronLeft size={14} strokeWidth={1.5} />
        </Link>

        <h1
          className="text-[15px] tracking-wide text-(--color-spa-stone) tabular-nums"
          style={{ fontFamily: 'var(--font-serif)' }}
          aria-live="polite"
        >
          {monthLbl} {yearLbl}
        </h1>

        <Link
          href={buildHref(shiftMonthIso(monthStart, 1))}
          aria-label="Próximo mês"
          className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
          scroll={false}
        >
          <ChevronRight size={14} strokeWidth={1.5} />
        </Link>

        <Link
          href={buildHref()}
          className="ml-2 px-3 py-1 rounded-full text-[11px] tracking-wide
                     border border-spa-border text-(--color-spa-stone)
                     hover:border-stone-400 hover:bg-stone-50 transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
          scroll={false}
        >
          {TODAY_LABEL[locale] ?? TODAY_LABEL.es}
        </Link>
      </div>

      {/* Right — quick actions (placeholders for Phase 2) */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Nova marcação"
          className="p-1.5 rounded-md text-spa-muted hover:text-[#D4AF37] hover:bg-stone-50 transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label="Mais opções"
          className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
        >
          <MoreHorizontal size={14} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
