'use client';

import { cn } from '@/shared/lib/utils';

interface EventChipProps {
  startAt:      Date;
  customerName: string;
  serviceColor: string | null;
  status:       string;        // 'pending' | 'confirmed' | 'cancelled' | …
  locale:       string;
  onClick?: () => void;
}

function formatTime(date: Date, locale: string): string {
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  // Use UTC to match the values stored without DST surprises in the dev seeder
  return date.toLocaleTimeString(tag, {
    hour:   '2-digit',
    minute: '2-digit',
    hour12: locale !== 'es',
    timeZone: 'UTC',
  });
}

/**
 * Single appointment line inside a month-cell. Inspired by Setmore's
 * dot + time + name pattern, restyled with our editorial tokens.
 *
 *   ●  10:00 AM  Sofia Coelho
 */
export function EventChip({
  startAt,
  customerName,
  serviceColor,
  status,
  locale,
  onClick,
}: EventChipProps) {
  const isCancelled = status === 'cancelled';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-1.5 px-1 py-0.5 rounded-sm text-left',
        'text-[11px] leading-tight truncate',
        'hover:bg-stone-100/80 transition-colors',
        isCancelled && 'opacity-50 line-through',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      title={`${formatTime(startAt, locale)} · ${customerName}`}
    >
      <span
        aria-hidden
        className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
        style={{ backgroundColor: serviceColor ?? '#D4AF37' }}
      />
      <span className="tabular-nums text-spa-muted shrink-0">
        {formatTime(startAt, locale)}
      </span>
      <span className="truncate text-(--color-spa-stone)">
        {customerName}
      </span>
    </button>
  );
}
