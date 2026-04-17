'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Calendar, Lock, X } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ChooseActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** ISO date YYYY-MM-DD of the clicked cell */
  dateIso: string;
  onPickBlock: () => void;
  onPickAppoint: () => void;
  locale?: string;
}

const WEEKDAYS_PT = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MONTHS_PT   = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];

function fmtHeading(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS_PT[date.getUTCDay()]}, ${d} de ${MONTHS_PT[m - 1]}`;
}

export function ChooseActionDialog({
  open,
  onOpenChange,
  dateIso,
  onPickBlock,
  onPickAppoint,
}: ChooseActionDialogProps) {
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
            'w-[460px] max-w-[calc(100vw-2rem)] rounded-lg border border-spa-border bg-white',
            'shadow-[0_24px_48px_-16px_rgba(28,25,23,0.25)] outline-none',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
            'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-spa-border">
            <div className="space-y-0.5">
              <p className="text-[11px] uppercase tracking-[0.16em] text-spa-muted"
                 style={{ fontFamily: 'var(--font-sans)' }}>
                Nova entrada
              </p>
              <Dialog.Title
                className="text-[16px] tracking-wide text-(--color-spa-stone) capitalize"
                style={{ fontFamily: 'var(--font-serif)' }}
              >
                {fmtHeading(dateIso)}
              </Dialog.Title>
            </div>
            <Dialog.Close
              className="p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
              aria-label="Fechar"
            >
              <X size={14} strokeWidth={1.5} />
            </Dialog.Close>
          </div>

          {/* Body — 2 big choice tiles */}
          <div className="grid grid-cols-2 gap-3 p-5">
            <ChoiceTile
              icon={<Lock size={18} strokeWidth={1.4} />}
              label="Bloquear data"
              description="Férias, doença, formação…"
              onClick={onPickBlock}
            />
            <ChoiceTile
              icon={<Calendar size={18} strokeWidth={1.4} />}
              label="Fazer uma marcação"
              description="Cliente · serviço · hora"
              onClick={onPickAppoint}
              accent
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ── Tile ───────────────────────────────────────────────────────────

function ChoiceTile({
  icon, label, description, onClick, accent,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-start gap-2 p-4 rounded-md text-left',
        'border border-spa-border bg-white transition-all duration-200',
        'hover:border-[#D4AF37]/60 hover:bg-stone-50',
        accent && 'border-[#D4AF37]/30 bg-[rgba(212,175,55,0.04)]',
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center w-9 h-9 rounded-md mb-1 transition-colors',
          accent
            ? 'bg-[rgba(212,175,55,0.14)] text-[#D4AF37]'
            : 'bg-stone-100 text-(--color-spa-stone) group-hover:text-[#D4AF37] group-hover:bg-[rgba(212,175,55,0.10)]',
        )}
      >
        {icon}
      </span>
      <p
        className="text-[14px] tracking-wide text-(--color-spa-stone)"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {label}
      </p>
      <p
        className="text-[11px] text-spa-muted"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {description}
      </p>
    </button>
  );
}
