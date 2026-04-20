'use client';

import { useState, useTransition } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { EditorialDatePicker } from './EditorialDatePicker';
import { blockDaysAction, type BlockDaysConflict } from '../actions/block-days';

const REASONS = ['vacation', 'illness', 'training', 'other'] as const;

const LABELS: Record<string, { from: string; to: string; reasonLabel: string; confirm: string; success: string; conflictHint: string; reason: Record<string, string> }> = {
  es: { from: 'Desde', to: 'Hasta', reasonLabel: 'Motivo', confirm: 'Bloquear días', success: 'Días bloqueados correctamente', conflictHint: 'Reserva existente:', reason: { vacation: 'Vacaciones', illness: 'Enfermedad', training: 'Formación', other: 'Evento' } },
  pt: { from: 'De',    to: 'Até',   reasonLabel: 'Motivo', confirm: 'Bloquear dias', success: 'Dias bloqueados com sucesso',   conflictHint: 'Reserva existente:', reason: { vacation: 'Férias',     illness: 'Doença',     training: 'Formação',  other: 'Evento' } },
  en: { from: 'From',  to: 'To',    reasonLabel: 'Reason', confirm: 'Block days',    success: 'Days blocked successfully',      conflictHint: 'Existing booking:',   reason: { vacation: 'Vacation',   illness: 'Illness',    training: 'Training',  other: 'Event'  } },
};

interface BlockDaysFormProps {
  selectedDate: Date;
  locale:       string;
  onClose:      () => void;
}

function toIso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtConflictDate(iso: string): string {
  const [, m = '', d = ''] = iso.split('-');
  return `${d}/${m}`;
}

export function BlockDaysForm({ selectedDate, locale, onClose }: BlockDaysFormProps) {
  const t           = LABELS[locale] ?? LABELS.es!;
  const minDateIso  = toIso(selectedDate);

  const [from,      setFrom]      = useState(minDateIso);
  const [to,        setTo]        = useState(minDateIso);
  const [reason,    setReason]    = useState<string>('vacation');
  const [conflicts, setConflicts] = useState<BlockDaysConflict[]>([]);
  const [errMsg,    setErrMsg]    = useState('');
  const [isPending, startTransition] = useTransition();

  function handleFromChange(iso: string) {
    setFrom(iso);
    if (to < iso) setTo(iso); // keep "to" ≥ "from"
    setConflicts([]);
    setErrMsg('');
  }

  function handleToChange(iso: string) {
    setTo(iso);
    setConflicts([]);
    setErrMsg('');
  }

  function handleSubmit() {
    startTransition(async () => {
      const result = await blockDaysAction(from, to, reason);
      if (result.status === 'success') {
        toast.success(t.success);
        onClose();
      } else if (result.status === 'conflict') {
        setConflicts(result.conflicts);
      } else if (result.status === 'error') {
        setErrMsg(result.message);
      }
    });
  }

  return (
    <div className="px-5 pb-5 space-y-4">
      {/* From / To pickers */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t.from}</label>
          <EditorialDatePicker value={from} onChange={handleFromChange} locale={locale} minDate={minDateIso} />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t.to}</label>
          <EditorialDatePicker value={to} onChange={handleToChange} locale={locale} minDate={from} />
        </div>
      </div>

      {/* Reason select */}
      <div>
        <label className="block text-[11px] font-medium text-stone-500 uppercase tracking-wide mb-1.5">{t.reasonLabel}</label>
        <Select.Root value={reason} onValueChange={setReason}>
          <Select.Trigger className="input-editorial w-full text-sm flex items-center justify-between">
            <Select.Value />
            <Select.Icon><ChevronDown size={14} className="text-stone-400" /></Select.Icon>
          </Select.Trigger>
          <Select.Portal>
            <Select.Content className="bg-white rounded-lg border border-stone-200 shadow-xl z-[60] overflow-hidden" position="popper" sideOffset={4}>
              <Select.Viewport className="p-1">
                {REASONS.map((r) => (
                  <Select.Item key={r} value={r} className="flex items-center gap-2 px-3 py-2 text-sm rounded-md cursor-pointer hover:bg-stone-50 outline-none data-[highlighted]:bg-stone-50">
                    <Select.ItemIndicator><Check size={12} className="text-[#D4AF37]" /></Select.ItemIndicator>
                    <Select.ItemText>{t.reason[r] ?? r}</Select.ItemText>
                  </Select.Item>
                ))}
              </Select.Viewport>
            </Select.Content>
          </Select.Portal>
        </Select.Root>
      </div>

      {/* Conflict list */}
      {conflicts.length > 0 && (
        <div className="space-y-1 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
          {conflicts.map((c, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[11px] text-red-700">
              <AlertCircle size={11} className="shrink-0 mt-0.5 text-red-500" />
              <span>{t.conflictHint} {fmtConflictDate(c.date)} {c.time} — {c.serviceName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Generic error */}
      {errMsg && <p className="text-xs text-red-500 bg-red-50 rounded-md px-3 py-2">{errMsg}</p>}

      <button type="button" onClick={handleSubmit} disabled={isPending}
        className="w-full py-3 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 active:scale-[0.98] transition-all disabled:opacity-60">
        {isPending ? '...' : t.confirm}
      </button>
    </div>
  );
}
