'use client';

import Link from 'next/link';
import { useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ViewSwitcher, type CalendarView } from './ViewSwitcher';

interface CalendarHeaderProps {
  monthStart: Date;
  locale:     string;
  view:       CalendarView;
}

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

function shiftMonthIso(monthStart: Date, delta: number): string {
  const d = new Date(monthStart);
  d.setUTCMonth(d.getUTCMonth() + delta);
  return d.toISOString().slice(0, 10);
}

export function CalendarHeader({ monthStart, locale, view }: CalendarHeaderProps) {
  const t          = useTranslations('dashboard.calendar.header');
  const intlLocale = INTL_LOCALE_MAP[useLocale()] ?? 'pt-PT';
  const pathname   = usePathname();
  const params     = useSearchParams();

  const buildHref = (monthIso?: string) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    if (monthIso) sp.set('month', monthIso);
    else          sp.delete('month');
    return `${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
  };

  const months   = t.raw('months') as string[];
  const monthLbl = months[monthStart.getUTCMonth()];
  const yearLbl  = monthStart.getUTCFullYear();

  return (
    <header className="h-14 px-5 flex items-center gap-3 border-b border-spa-border bg-white/85 backdrop-blur-md shrink-0">
      {/* Left — view dropdown */}
      <ViewSwitcher current={view} locale={locale} />

      {/* Center — month navigation */}
      <div className="flex-1 flex items-center justify-center gap-3">
        <Link
          href={buildHref(shiftMonthIso(monthStart, -1))}
          aria-label={t('prevMonthAriaLabel')}
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
          aria-label={t('nextMonthAriaLabel')}
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
          {t('todayLabel')}
        </Link>
      </div>

      {/* Right — quick actions */}
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label={t('newApptAriaLabel')}
          className="p-1.5 rounded-md text-spa-muted hover:text-[#D4AF37] hover:bg-stone-50 transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
        </button>
        <button
          type="button"
          aria-label={t('moreAriaLabel')}
          className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
        >
          <MoreHorizontal size={14} strokeWidth={1.5} />
        </button>
      </div>
    </header>
  );
}
