'use client';

import * as Popover from '@radix-ui/react-popover';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { useTranslations } from 'next-intl';

gsap.registerPlugin(useGSAP);

export type CalendarView = 'day' | 'week' | 'month' | 'team';

interface ViewSwitcherProps {
  current: CalendarView;
  locale?: string;
}

const VIEWS: CalendarView[] = ['day', 'week', 'month', 'team'];

export function ViewSwitcher({ current }: ViewSwitcherProps) {
  const t        = useTranslations('calendar.view');
  const tHeader  = useTranslations('dashboard.calendar.header');
  const router   = useRouter();
  const params   = useSearchParams();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const activeBgRef  = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current || !activeBgRef.current) return;
    const activeBtn = containerRef.current.querySelector(`[data-view="${current}"]`) as HTMLElement;
    if (activeBtn) {
      gsap.to(activeBgRef.current, {
        y: activeBtn.offsetTop, height: activeBtn.offsetHeight,
        duration: 0.3, ease: 'power2.out', overwrite: 'auto',
      });
    }
  }, { scope: containerRef, dependencies: [current] });

  const setView = (next: CalendarView) => {
    if (next === current) return;
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set('view', next);
    startTransition(() => router.push(`/dashboard/calendar?${sp.toString()}`, { scroll: false }));
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
        aria-label={tHeader('viewSwitcherAriaLabel')}
      >
        <span className="text-spa-muted">{tHeader('viewSwitcherLabel')}</span>
        <span className="font-medium">· {t(current)}</span>
        <ChevronDown size={12} strokeWidth={1.5} className="text-spa-muted" />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-md border border-spa-border bg-white
                     shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)]
                     p-1 outline-none relative
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                     data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95"
        >
          <div ref={containerRef} className="relative w-full">
            <div
              ref={activeBgRef}
              className="absolute left-0 right-0 rounded-sm bg-stone-50 pointer-events-none"
              style={{ top: 0, height: 0 }}
            />
            {VIEWS.map((v) => (
              <button
                key={v}
                data-view={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2 rounded-sm relative z-10',
                  'text-[12px] text-left transition-colors',
                  v === current
                    ? 'text-(--color-spa-stone) font-medium'
                    : 'text-spa-muted hover:text-(--color-spa-stone)',
                )}
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                <span>{t(v)}</span>
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
