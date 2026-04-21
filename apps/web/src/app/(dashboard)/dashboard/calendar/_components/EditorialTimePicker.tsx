'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Clock } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface EditorialTimePickerProps {
  /** "HH:MM" 24-hour format */
  value: string;
  onChange: (hhmm: string) => void;
  label?: string;
  /** Step in minutes (default 15) */
  step?: number;
  /** Open hour, default 7 */
  fromHour?: number;
  /** Close hour exclusive, default 22 */
  toHour?: number;
  disabled?: boolean;
}

function pad(n: number) { return n.toString().padStart(2, '0'); }

export function EditorialTimePicker({
  value,
  onChange,
  label,
  step = 15,
  fromHour = 7,
  toHour = 22,
  disabled,
}: EditorialTimePickerProps) {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = fromHour; h < toHour; h++) {
      for (let m = 0; m < 60; m += step) {
        out.push(`${pad(h)}:${pad(m)}`);
      }
    }
    return out;
  }, [fromHour, toHour, step]);

  // Auto-scroll to selected on open
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-time="${value}"]`);
    if (el) el.scrollIntoView({ block: 'center' });
  }, [open, value]);

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
              'inline-flex items-center gap-2 px-3 py-2 rounded-md',
              'text-[13px] tracking-wide text-(--color-spa-stone)',
              'border border-spa-border bg-white hover:bg-stone-50',
              'transition-colors data-[state=open]:border-stone-300',
              disabled && 'opacity-50 cursor-not-allowed',
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
            aria-label="Selecionar hora"
          >
            <Clock size={13} strokeWidth={1.5} className="text-spa-muted" />
            <span className="tabular-nums">{value}</span>
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className={cn(
              'z-50 w-[120px] rounded-md border border-spa-border bg-white p-1',
              'shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)] outline-none',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            )}
          >
            <div ref={listRef} className="max-h-[240px] overflow-y-auto no-scrollbar">
              {slots.map((s) => {
                const active = s === value;
                return (
                  <button
                    key={s}
                    type="button"
                    data-time={s}
                    onClick={() => { onChange(s); setOpen(false); }}
                    className={cn(
                      'w-full text-left px-3 py-1.5 text-[12px] tabular-nums rounded-sm transition-colors',
                      active
                        ? 'bg-stone-50 text-(--color-spa-stone) font-medium'
                        : 'text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50',
                    )}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {s}
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
