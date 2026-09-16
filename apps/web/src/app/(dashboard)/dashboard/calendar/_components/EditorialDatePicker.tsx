'use client';

import { useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { MONTH_KEYS, MONDAY_FIRST_DAY_KEYS } from '@/i18n/calendar-keys';
import { cn } from '@/shared/lib/utils';

interface EditorialDatePickerProps {
  /** ISO date YYYY-MM-DD */
  value: string;
  onChange: (iso: string) => void;
  /** Optional label rendered above the trigger */
  label?: string;
  disabled?: boolean;
  /** ISO YYYY-MM-DD — disable individual cells before this date */
  minDate?: string;
}

function pad(n: number) { return n.toString().padStart(2, '0'); }
function toIso(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }
function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  return { y, m: m - 1, d };
}

function fmtTrigger(iso: string, months: string[]): string {
  const { y, m, d } = parseIso(iso);
  const monthAbbrev = (months[m] ?? '').slice(0, 3);
  return `${d} ${monthAbbrev} ${y}`;
}

/**
 * Editorial date picker — Radix Popover + custom month grid.
 * Grid week starts on Monday (PT/ES convention).
 */
export function EditorialDatePicker({
  value,
  onChange,
  label,
  disabled,
  minDate,
}: EditorialDatePickerProps) {
  const tCal = useTranslations('calendar');
  const t    = useTranslations('dashboard.calendar.header');
  const tDp  = useTranslations('dashboard.calendar.datePicker');

  const initial = useMemo(() => parseIso(value), [value]);
  const [viewYear,  setViewYear]  = useState(initial.y);
  const [viewMonth, setViewMonth] = useState(initial.m);
  const [open, setOpen] = useState(false);

  const months = MONTH_KEYS.map((k) => tCal(`months.${k}`));
  const days   = MONDAY_FIRST_DAY_KEYS.map((k) => tCal(`days.${k}`).slice(0, 1));
  const monthLabel = months[viewMonth];

  // 6×7 grid starting on Monday
  const cells = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
    // 0=Sun…6=Sat → shift so Monday is column 0
    const dow = (firstOfMonth.getUTCDay() + 6) % 7;
    const gridStart = new Date(firstOfMonth);
    gridStart.setUTCDate(gridStart.getUTCDate() - dow);

    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(gridStart);
      d.setUTCDate(d.getUTCDate() + i);
      return d;
    });
  }, [viewYear, viewMonth]);

  const selectedIso = value;
  const todayIso = (() => {
    const now = new Date();
    return toIso(now.getFullYear(), now.getMonth(), now.getDate());
  })();

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] uppercase tracking-[0.14em] text-spa-muted"
              style={{ fontFamily: 'var(--font-sans)' }}>
          {label}
        </span>
      )}

      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'group inline-flex items-center gap-2 px-3 py-2 rounded-md',
              'text-[13px] tracking-wide text-(--color-spa-stone)',
              'border border-spa-border bg-white hover:bg-stone-50',
              'transition-colors data-[state=open]:border-stone-300',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
            aria-label={tDp('selectDateAriaLabel')}
          >
            <Calendar size={13} strokeWidth={1.5} className="text-spa-muted" />
            <span className="tabular-nums">{fmtTrigger(value, months)}</span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className={cn(
              'z-50 w-[280px] rounded-md border border-spa-border bg-white p-3',
              'shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)] outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            )}
          >
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={goPrev}
                className="p-1 rounded text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100 transition-colors"
                aria-label={t('prevMonthAriaLabel')}
              >
                <ChevronLeft size={14} strokeWidth={1.5} />
              </button>

              <p className="text-[13px] tracking-wide text-(--color-spa-stone)"
                 style={{ fontFamily: 'var(--font-serif)' }}>
                {monthLabel} {viewYear}
              </p>

              <button
                type="button"
                onClick={goNext}
                className="p-1 rounded text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100 transition-colors"
                aria-label={t('nextMonthAriaLabel')}
              >
                <ChevronRight size={14} strokeWidth={1.5} />
              </button>
            </div>

            {/* Day-of-week row */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {days.map((d, i) => (
                <span key={i} className="text-[10px] text-center text-spa-muted uppercase tracking-wider"
                      style={{ fontFamily: 'var(--font-sans)' }}>
                  {d}
                </span>
              ))}
            </div>

            {/* 6×7 grid */}
            <div className="grid grid-cols-7 gap-1">
              {cells.map((d) => {
                const cellIso  = toIso(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
                const inMonth  = d.getUTCMonth() === viewMonth;
                const isSelected = cellIso === selectedIso;
                const isToday    = cellIso === todayIso;

                const beforeMin = !!minDate && cellIso < minDate;
                return (
                  <button
                    key={cellIso}
                    type="button"
                    onClick={() => { if (!beforeMin) { onChange(cellIso); setOpen(false); } }}
                    disabled={beforeMin}
                    className={cn(
                      'h-8 rounded-sm text-[12px] tabular-nums transition-colors',
                      isSelected && 'bg-(--color-spa-stone) text-white font-medium',
                      !isSelected && isToday && 'border border-[#D4AF37] text-(--color-spa-stone)',
                      !isSelected && !isToday && inMonth && 'text-(--color-spa-stone) hover:bg-stone-100',
                      !isSelected && !inMonth && 'text-stone-300 hover:bg-stone-50',
                      beforeMin && 'opacity-25 cursor-not-allowed hover:bg-transparent',
                    )}
                    style={{ fontFamily: 'var(--font-sans)' }}
                    aria-pressed={isSelected}
                  >
                    {d.getUTCDate()}
                  </button>
                );
              })}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
