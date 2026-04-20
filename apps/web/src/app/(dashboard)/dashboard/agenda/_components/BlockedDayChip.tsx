'use client';

import { Ban } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const REASON_LABELS: Record<string, Record<string, string>> = {
  es: { vacation: 'Vacaciones', illness: 'Enfermedad', training: 'Formación', other: 'Evento' },
  pt: { vacation: 'Férias',     illness: 'Doença',     training: 'Formação',  other: 'Evento' },
  en: { vacation: 'Vacation',   illness: 'Illness',    training: 'Training',  other: 'Event'  },
};

interface BlockedDayChipProps {
  reason: string;
  locale: string;
}

/**
 * Visual chip for blocked days inside the monthly grid cell.
 * Mirrors EventChip height/structure for visual consistency.
 */
export function BlockedDayChip({ reason, locale }: BlockedDayChipProps) {
  const labels = REASON_LABELS[locale] ?? REASON_LABELS.es!;
  const label  = labels[reason] ?? reason;

  return (
    <div
      className={cn(
        'w-full flex items-center gap-1.5 px-1 py-0.5 rounded-sm',
        'text-[11px] leading-tight truncate',
        'bg-slate-100 text-slate-500',
      )}
      style={{ fontFamily: 'var(--font-sans)' }}
      title={label}
    >
      <Ban
        aria-hidden
        size={10}
        className="text-slate-400 shrink-0"
      />
      <span className="truncate">{label}</span>
    </div>
  );
}
