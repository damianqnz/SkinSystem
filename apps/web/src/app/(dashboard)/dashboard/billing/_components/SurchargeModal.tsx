'use client';

import { useState, useEffect }                                    from 'react';
import * as Dialog                                                from '@radix-ui/react-dialog';
import { X, Loader2 }                                             from 'lucide-react';
import { toast }                                                  from 'sonner';
import { createSurchargeAction, updateSurchargeAction }           from '../actions-surcharges';
import type { SurchargeRow }                                      from '../actions-surcharges';

// ── Types ─────────────────────────────────────────────────────

interface Props {
  open:        boolean;
  editing:     SurchargeRow | null;   // null = create mode
  onClose:     () => void;
  onSaved:     (row: SurchargeRow) => void;
}

// ── Component ─────────────────────────────────────────────────

export function SurchargeModal({ open, editing, onClose, onSaved }: Props) {
  const [kind,      setKind]      = useState<'taxa' | 'reducao'>('taxa');
  const [name,      setName]      = useState('');
  const [valueType, setValueType] = useState<'percent' | 'fixed'>('percent');
  const [amount,    setAmount]    = useState('');
  const [busy,      setBusy]      = useState(false);

  // Populate form when editing
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setKind(editing.isReduction ? 'reducao' : 'taxa');
      setName(editing.name);
      setValueType(editing.valueType);
      setAmount(editing.value);
    } else {
      setKind('taxa');
      setName('');
      setValueType('percent');
      setAmount('');
    }
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!name.trim())        return toast.error('O nome é obrigatório');
    if (isNaN(numAmount) || numAmount <= 0) return toast.error('Insira um valor válido');

    setBusy(true);
    const payload = { name: name.trim(), valueType, value: numAmount, isReduction: kind === 'reducao' };

    const res = editing
      ? await updateSurchargeAction(editing.id, payload)
      : await createSurchargeAction(payload);

    setBusy(false);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    toast.success(editing ? 'Taxa atualizada' : 'Taxa criada');
    onSaved(res.data!);
  }

  const title = editing
    ? `Editar ${editing.isReduction ? 'redução' : 'taxa'} adicional`
    : 'Taxa ou redução adicional nova';

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2
                     bg-white rounded-2xl shadow-xl p-6 focus:outline-none"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <Dialog.Title className="font-cormorant text-lg font-semibold text-stone-800 leading-tight">
              {title}
            </Dialog.Title>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 transition-colors -mr-1">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Kind selector */}
            <div className="grid grid-cols-2 gap-2">
              {(['taxa', 'reducao'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors
                    ${kind === k
                      ? 'border-stone-800 bg-stone-900 text-white'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'}`}
                >
                  {k === 'taxa' ? 'Taxa' : 'Redução'}
                </button>
              ))}
            </div>

            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Nome da {kind === 'taxa' ? 'taxa' : 'redução'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={kind === 'taxa' ? 'Ex: IVA, Taxa de serviço…' : 'Ex: Desconto especial…'}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                           placeholder:text-stone-400 focus:outline-none focus:border-amber-300
                           focus:ring-1 focus:ring-amber-200 transition-colors"
              />
            </div>

            {/* Value type + Amount */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Tipo de valor</label>
                <select
                  value={valueType}
                  onChange={(e) => setValueType(e.target.value as 'percent' | 'fixed')}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                             bg-white focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                             transition-colors appearance-none cursor-pointer"
                >
                  <option value="percent">Porcentagem (%)</option>
                  <option value="fixed">Quantia fixa</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  {valueType === 'percent' ? 'Percentagem (%)' : 'Valor (€)'}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={valueType === 'percent' ? '10' : '5.00'}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                             placeholder:text-stone-400 focus:outline-none focus:border-amber-300
                             focus:ring-1 focus:ring-amber-200 transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600
                           hover:bg-stone-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white
                           text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                {editing ? 'Guardar' : 'Criar'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
