'use client';

import { cn } from '@/shared/lib/utils';
import { useTranslations } from 'next-intl';
import type { ClientStatus } from '@/domains/customers/service';

interface Props {
  status: ClientStatus;
  locale?: string;
}

const CONFIG: Record<ClientStatus, { dot: string; bg: string; text: string; border: string }> = {
  nuevo:      { dot: 'bg-emerald-500', bg: 'bg-emerald-50',   text: 'text-emerald-700', border: 'border-emerald-200' },
  recurrente: { dot: 'bg-sky-500',     bg: 'bg-sky-50',       text: 'text-sky-700',     border: 'border-sky-200'     },
  riesgo:     { dot: 'bg-amber-500',   bg: 'bg-amber-50',     text: 'text-amber-700',   border: 'border-amber-200'   },
  inactivo:   { dot: 'bg-orange-500',  bg: 'bg-orange-50',    text: 'text-orange-700',  border: 'border-orange-200'  },
  perdido:    { dot: 'bg-rose-500',    bg: 'bg-rose-50',      text: 'text-rose-700',    border: 'border-rose-200'    },
};

export function CustomerStatusBadge({ status }: Props) {
  const t   = useTranslations('customers.status');
  const cfg = CONFIG[status];

  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider border font-sans',
      cfg.bg, cfg.text, cfg.border,
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', cfg.dot)} />
      {t(status)}
    </span>
  );
}
