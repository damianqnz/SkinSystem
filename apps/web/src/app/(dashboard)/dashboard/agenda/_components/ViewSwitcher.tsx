'use client';

import * as Popover from '@radix-ui/react-popover';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export type CalendarView = 'day' | 'week' | 'month' | 'team';

const VIEW_LABELS: Record<CalendarView, string> = {
  day:   'Dia',
  week:  'Semana',
  month: 'Mês',
  team:  'Equipa',
};

interface ViewSwitcherProps {
  current: CalendarView;
}

/**
 * Dropdown to switch the calendar view.
 * Persists choice via the `view` URL search-param so the server can
 * render the correct view on full reloads.
 */
export function ViewSwitcher({ current }: ViewSwitcherProps) {
  const router  = useRouter();
  const params  = useSearchParams();
  const [pending, startTransition] = useTransition();

  const setView = (next: CalendarView) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set('view', next);
    startTransition(() => router.push(`?${sp.toString()}`, { scroll: false }));
  };

  return (
    <Popover.Root>
      <Popover.Trigger
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1.5 rounded-md',
          'text-[12px] tracking-wide text-(--color-spa-stone)',
          'border border-spa-border bg-white hover:bg-stone-50',
          'transition-colors duration-150',
          'data-[state=open]:bg-stone-50 data-[state=open]:border-stone-300',
          pending && 'opacity-60',
        )}
        style={{ fontFamily: 'var(--font-sans)' }}
        aria-label="Alterar vista"
      >
        <span className="text-spa-muted">Visualização do calendário</span>
        <span className="font-medium">· {VIEW_LABELS[current]}</span>
        <ChevronDown size={12} strokeWidth={1.5} className="text-spa-muted" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-md border border-spa-border bg-white
                     shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)]
                     p-1 outline-none
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                     data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          {(Object.keys(VIEW_LABELS) as CalendarView[]).map((v) => {
            const active = v === current;
            return (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-sm',
                  'text-[12px] text-left transition-colors',
                  active
                    ? 'text-(--color-spa-stone) font-medium bg-stone-50'
                    : 'text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50',
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <span>{VIEW_LABELS[v]}</span>
                {active && <Check size={12} strokeWidth={1.75} className="text-[#D4AF37]" />}
              </button>
            );
          })}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
