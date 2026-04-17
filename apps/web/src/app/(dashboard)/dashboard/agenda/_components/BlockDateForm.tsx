'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { useState, useTransition } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

import { EditorialDatePicker } from './EditorialDatePicker';
import { EditorialTimePicker } from './EditorialTimePicker';
import { createBlockedIntervalAction } from '../actions';

interface BlockDateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onBack: () => void;
  /** ISO YYYY-MM-DD pre-selected from the cell click */
  defaultDateIso: string;
  onSuccess: () => void;
}

const REASONS = [
  { id: 'vacation', label: 'Férias'    },
  { id: 'illness',  label: 'Doença'    },
  { id: 'training', label: 'Formação'  },
  { id: 'other',    label: 'Outro'     },
] as const;

type Reason = (typeof REASONS)[number]['id'];

function isoFromDateTime(dateIso: string, hhmm: string): string {
  return new Date(`${dateIso}T${hhmm}:00`).toISOString();
}

export function BlockDateForm({
  open,
  onOpenChange,
  onBack,
  defaultDateIso,
  onSuccess,
}: BlockDateFormProps) {
  const [fromDate, setFromDate] = useState(defaultDateIso);
  const [fromTime, setFromTime] = useState('09:00');
  const [toDate,   setToDate]   = useState(defaultDateIso);
  const [toTime,   setToTime]   = useState('17:00');
  const [reason,   setReason]   = useState<Reason>('vacation');

  const [pending, startTransition] = useTransition();

  const submit = () => {
    const startAt = isoFromDateTime(fromDate, fromTime);
    const endAt   = isoFromDateTime(toDate,   toTime);
    if (new Date(endAt) <= new Date(startAt)) {
      toast.error('A data final deve ser depois da inicial');
      return;
    }

    startTransition(async () => {
      const res = await createBlockedIntervalAction({ startAt, endAt, reason });
      if (res.status === 'success') {
        toast.success(res.message ?? 'Período bloqueado');
        onSuccess();
      } else if (res.status === 'error') {
        toast.error(res.message);
      }
    });
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className={cn(
            'fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
          )}
        />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
            'w-[480px] max-w-[calc(100vw-2rem)] rounded-lg border border-spa-border bg-white',
            'shadow-[0_24px_48px_-16px_rgba(28,25,23,0.25)] outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-spa-border">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-[12px] text-spa-muted hover:text-(--color-spa-stone) transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <ArrowLeft size={12} strokeWidth={1.5} />
              Voltar
            </button>
            <Dialog.Title
              className="text-[16px] tracking-wide text-(--color-spa-stone)"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              Bloquear data
            </Dialog.Title>
            <Dialog.Close
              className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
              aria-label="Fechar"
            >
              <X size={14} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-5">
            {/* Desde */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-spa-muted"
                 style={{ fontFamily: 'var(--font-sans)' }}>
                Desde
              </p>
              <div className="flex items-center gap-2">
                <EditorialDatePicker value={fromDate} onChange={setFromDate} />
                <EditorialTimePicker value={fromTime} onChange={setFromTime} />
              </div>
            </div>

            {/* Até */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-spa-muted"
                 style={{ fontFamily: 'var(--font-sans)' }}>
                Até
              </p>
              <div className="flex items-center gap-2">
                <EditorialDatePicker value={toDate} onChange={setToDate} />
                <EditorialTimePicker value={toTime} onChange={setToTime} />
              </div>
            </div>

            {/* Motivo */}
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-spa-muted"
                 style={{ fontFamily: 'var(--font-sans)' }}>
                Motivo
              </p>
              <div className="flex flex-wrap gap-1.5">
                {REASONS.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setReason(r.id)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-[12px] tracking-wide transition-colors',
                      reason === r.id
                        ? 'bg-(--color-spa-stone) text-white border border-(--color-spa-stone)'
                        : 'bg-white text-(--color-spa-stone) border border-spa-border hover:border-stone-400',
                    )}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-spa-border">
            <Dialog.Close
              className="px-3 py-1.5 rounded-md text-[12px] text-spa-muted hover:text-(--color-spa-stone) transition-colors"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Cancelar
            </Dialog.Close>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className={cn(
                'shimmer-btn px-4 py-1.5 rounded-md text-[12px] font-medium',
                'bg-(--color-spa-stone) text-white hover:bg-stone-800 transition-colors',
                'disabled:opacity-50 disabled:cursor-not-allowed',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              {pending ? 'A bloquear…' : 'Bloquear →'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
