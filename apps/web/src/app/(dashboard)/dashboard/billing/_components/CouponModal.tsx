'use client';

import { useState, useEffect }                              from 'react';
import * as Dialog                                          from '@radix-ui/react-dialog';
import { X, Loader2 }                                       from 'lucide-react';
import { toast }                                            from 'sonner';
import { createCouponAction, updateCouponAction }           from '../actions-coupons';
import type { CouponRow }                                   from '../actions-coupons';

// ── Helpers ───────────────────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10); }

// ── Props ─────────────────────────────────────────────────────

interface Props {
  open:    boolean;
  editing: CouponRow | null;
  onClose: () => void;
  onSaved: (row: CouponRow) => void;
}

// ── Component ─────────────────────────────────────────────────

export function CouponModal({ open, editing, onClose, onSaved }: Props) {
  const [code,         setCode]         = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [value,        setValue]        = useState('');
  const [maxUses,      setMaxUses]      = useState('');
  const [validFrom,    setValidFrom]    = useState(todayISO());
  const [validUntil,   setValidUntil]   = useState('');
  const [busy,         setBusy]         = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCode(editing.code);
      setDiscountType(editing.discountType);
      setValue(editing.discountValue);
      setMaxUses(editing.maxUses != null ? String(editing.maxUses) : '');
      setValidFrom(editing.validFrom.slice(0, 10));
      setValidUntil(editing.validUntil ? editing.validUntil.slice(0, 10) : '');
    } else {
      setCode('');
      setDiscountType('percent');
      setValue('');
      setMaxUses('');
      setValidFrom(todayISO());
      setValidUntil('');
    }
  }, [open, editing]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const num = parseFloat(value);
    if (!code.trim())                      return toast.error('O código é obrigatório');
    if (isNaN(num) || num <= 0)            return toast.error('Insira um valor de desconto válido');
    if (discountType === 'percent' && num > 100) return toast.error('A percentagem não pode ser superior a 100');

    const payload = {
      code:          code.trim().toUpperCase(),
      discountType,
      discountValue: num,
      maxUses:       maxUses ? parseInt(maxUses, 10) : null,
      validFrom,
      validUntil:    validUntil || null,
    };

    setBusy(true);
    const res = editing
      ? await updateCouponAction(editing.id, payload)
      : await createCouponAction(payload);
    setBusy(false);

    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? 'Cupão atualizado' : 'Cupão criado');
    onSaved(res.data!);
  }

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
              {editing ? 'Editar cupão' : 'Novo cupão de desconto'}
            </Dialog.Title>
            <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 transition-colors -mr-1">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Código do cupão
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ex: VERAO20"
                maxLength={30}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                           font-mono placeholder:font-sans placeholder:text-stone-400
                           focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                           transition-colors uppercase"
              />
            </div>

            {/* Discount type + value */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Tipo de desconto</label>
                <select
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                             bg-white focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                             transition-colors appearance-none cursor-pointer"
                >
                  <option value="percent">Percentagem (%)</option>
                  <option value="fixed">Valor fixo (€)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  {discountType === 'percent' ? 'Percentagem (%)' : 'Valor (€)'}
                </label>
                <input
                  type="number"
                  min="0.01"
                  max={discountType === 'percent' ? 100 : undefined}
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={discountType === 'percent' ? '20' : '10.00'}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                             placeholder:text-stone-400 focus:outline-none focus:border-amber-300
                             focus:ring-1 focus:ring-amber-200 transition-colors"
                />
              </div>
            </div>

            {/* Max uses */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                Limite de usos <span className="normal-case text-stone-400">(opcional)</span>
              </label>
              <input
                type="number"
                min="1"
                step="1"
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                placeholder="Ilimitado"
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800
                           placeholder:text-stone-400 focus:outline-none focus:border-amber-300
                           focus:ring-1 focus:ring-amber-200 transition-colors"
              />
            </div>

            {/* Validity dates */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">Válido desde</label>
                <input
                  type="date"
                  value={validFrom}
                  onChange={(e) => setValidFrom(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700
                             focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                             transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
                  Expira em <span className="normal-case text-stone-400">(opcional)</span>
                </label>
                <input
                  type="date"
                  value={validUntil}
                  min={validFrom}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700
                             focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                             transition-colors"
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
                {editing ? 'Guardar' : 'Criar cupão'}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
