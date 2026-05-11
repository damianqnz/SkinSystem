'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ViewSwitcher, type CalendarView } from './ViewSwitcher';

interface CalendarDayNavProps {
  date:   Date;
  locale: string;
  view:   CalendarView;
}

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

function isToday(d: Date, view: CalendarView): boolean {
  const now = new Date();
  if (view === 'week') {
    const dow          = d.getUTCDay();
    const diffToMonday = dow === 0 ? -6 : 1 - dow;
    const start = new Date(d); start.setUTCDate(d.getUTCDate() + diffToMonday); start.setUTCHours(0, 0, 0, 0);
    const end   = new Date(start); end.setUTCDate(start.getUTCDate() + 6); end.setUTCHours(23, 59, 59, 999);
    return now >= start && now <= end;
  }
  return d.getUTCFullYear() === now.getFullYear() && d.getUTCMonth() === now.getMonth() && d.getUTCDate() === now.getDate();
}

export function CalendarDayNav({ date, locale, view }: CalendarDayNavProps) {
  const t          = useTranslations('dashboard.calendar.dayNav');
  const intlLocale = INTL_LOCALE_MAP[useLocale()] ?? 'pt-PT';
  const router     = useRouter();
  const path       = usePathname();
  const params     = useSearchParams();

  const days   = t.raw('days')   as string[];
  const months = t.raw('months') as string[];

  function fmtDate(): { dayName: string; full: string } {
    if (view === 'week') {
      const dow          = date.getUTCDay();
      const diffToMonday = dow === 0 ? -6 : 1 - dow;
      const start = new Date(date); start.setUTCDate(date.getUTCDate() + diffToMonday);
      const end   = new Date(start); end.setUTCDate(start.getUTCDate() + 6);
      const full  = start.getUTCMonth() === end.getUTCMonth()
        ? `${start.getUTCDate()} - ${end.getUTCDate()} ${months[start.getUTCMonth()]} ${start.getUTCFullYear()}`
        : `${start.getUTCDate()} ${months[start.getUTCMonth()]?.slice(0, 3)} - ${end.getUTCDate()} ${months[end.getUTCMonth()]?.slice(0, 3)} ${start.getUTCFullYear()}`;
      return { dayName: t('weekLabel'), full };
    }
    return {
      dayName: days[date.getUTCDay()]!,
      full:    `${date.getUTCDate()} ${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`,
    };
  }

  function navigate(delta: number) {
    const d    = new Date(date);
    const step = view === 'week' ? 7 : 1;
    d.setUTCDate(d.getUTCDate() + delta * step);
    const sp = new URLSearchParams(params.toString());
    sp.set('date', d.toISOString().slice(0, 10));
    router.push(`${path}?${sp.toString()}`);
  }

  function goToday() {
    const sp = new URLSearchParams(params.toString());
    sp.delete('date');
    router.push(`${path}?${sp.toString()}`);
  }

  const today               = isToday(date, view);
  const { dayName, full }   = fmtDate();
  const prevLabel = view === 'week' ? t('prevWeekAriaLabel') : t('prevAriaLabel');
  const nextLabel = view === 'week' ? t('nextWeekAriaLabel') : t('nextAriaLabel');

  return (
    <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-100">
      <div className="flex items-center gap-3 px-4 py-3">
        <ViewSwitcher current={view} locale={locale} />

        <div className="flex items-center gap-2 flex-1 justify-center">
          <button onClick={() => navigate(-1)} aria-label={prevLabel} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
            <ChevronLeft size={15} />
          </button>
          <div className="text-center min-w-[160px]">
            <p className={['text-sm font-semibold', today ? 'text-amber-600' : 'text-stone-800'].join(' ')}>{dayName}</p>
            <p className="text-[11px] text-stone-400 tabular-nums">{full}</p>
          </div>
          <button onClick={() => navigate(1)} aria-label={nextLabel} className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
            <ChevronRight size={15} />
          </button>
        </div>

        <button onClick={goToday} disabled={today} className="flex items-center gap-1.5 px-2.5 py-1.5 text-[11px] font-medium text-stone-500 border border-stone-200 rounded-lg hover:bg-stone-50 disabled:opacity-40 transition-colors">
          <CalendarDays size={12} />
          {t('todayBtn')}
        </button>
      </div>
    </div>
  );
}
