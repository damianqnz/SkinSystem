'use client';

import { useEffect, useActionState, useState, useId } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import * as Slider from '@radix-ui/react-slider';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createServiceAction, updateServiceAction } from '../actions';
import type { CatalogActionState } from '../actions';
import type { ServiceRow, CategoryWithServices } from '@/domains/catalog/service';

// ── Types ─────────────────────────────────────────────────────

interface ServiceDrawerProps {
  open:           boolean;
  onClose:        () => void;
  onSuccess:      () => void;
  categories:     Pick<CategoryWithServices, 'id' | 'nameI18n'>[];
  locale:         string;
  /** If provided → edit mode; otherwise → create mode */
  service?:       ServiceRow | null;
  /** Pre-select a category when creating from within an island */
  defaultCategoryId?: string | null;
  organizationId: string;
}

type I18n = { es: string; en: string; pt: string };

const IDLE: CatalogActionState = { status: 'idle' };

const COLOR_PALETTE = [
  '#D4AF37', '#0EA5E9', '#10B981', '#F59E0B',
  '#8B5CF6', '#EF4444', '#EC4899', '#64748B',
];

// ── Helper ────────────────────────────────────────────────────

function resolveI18n(obj: unknown, locale: string): string {
  if (!obj || typeof obj !== 'object') return '';
  const o = obj as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? '';
}

// ── Component ─────────────────────────────────────────────────

export function ServiceDrawer({
  open, onClose, onSuccess,
  categories, locale, service,
  defaultCategoryId, organizationId,
}: ServiceDrawerProps) {
  const isEdit = !!service;
  const id     = useId();

  // ── Form state ─────────────────────────────────────────────
  const [nameI18n,  setNameI18n]  = useState<I18n>({ es: '', en: '', pt: '' });
  const [descI18n,  setDescI18n]  = useState<I18n>({ es: '', en: '', pt: '' });
  const [price,     setPrice]     = useState('');
  const [duration,  setDuration]  = useState('60');
  const [deposit,   setDeposit]   = useState(100);
  const [bufBefore, setBufBefore] = useState('0');
  const [bufAfter,  setBufAfter]  = useState('0');
  const [catId,     setCatId]     = useState<string>('');
  const [isActive,  setIsActive]  = useState(true);
  const [color,     setColor]     = useState<string>('');
  const [tab,       setTab]       = useState<'es' | 'en' | 'pt'>('es');

  // Sync form when service changes (edit mode) or drawer opens
  useEffect(() => {
    if (open) {
      if (service) {
        const n = service.nameI18n as Record<string, string>;
        const d = service.descriptionI18n as Record<string, string>;
        setNameI18n({ es: n['es'] ?? '', en: n['en'] ?? '', pt: n['pt'] ?? '' });
        setDescI18n({ es: d['es'] ?? '', en: d['en'] ?? '', pt: d['pt'] ?? '' });
        setPrice(String(service.priceCents / 100));
        setDuration(String(service.durationMinutes));
        setDeposit(service.depositPercent);
        setBufBefore(String(service.bufferBeforeMinutes));
        setBufAfter(String(service.bufferAfterMinutes));
        setCatId(service.categoryId ?? '');
        setIsActive(service.isActive);
        setColor(service.color ?? '');
      } else {
        // Reset for create
        setNameI18n({ es: '', en: '', pt: '' });
        setDescI18n({ es: '', en: '', pt: '' });
        setPrice('');
        setDuration('60');
        setDeposit(100);
        setBufBefore('0');
        setBufAfter('0');
        setCatId(defaultCategoryId ?? '');
        setIsActive(true);
        setColor('');
        setTab('es');
      }
    }
  }, [open, service, defaultCategoryId]);

  // ── Server Action ──────────────────────────────────────────
  const action = isEdit ? updateServiceAction : createServiceAction;
  const [state, dispatch, isPending] = useActionState<CatalogActionState, unknown>(action, IDLE);

  useEffect(() => {
    if (state.status === 'success') {
      toast.success(state.message);
      onSuccess();
      onClose();
    }
    if (state.status === 'error') {
      toast.error(state.message);
    }
  }, [state]);

  // ── Submit ─────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(price || '0') * 100);

    const payload: Record<string, unknown> = {
      nameI18n:            nameI18n,
      descriptionI18n:     descI18n,
      priceCents,
      durationMinutes:     parseInt(duration, 10),
      depositPercent:      deposit,
      bufferBeforeMinutes: parseInt(bufBefore, 10),
      bufferAfterMinutes:  parseInt(bufAfter, 10),
      categoryId:          catId || null,
      isActive,
      color:               color || null,
    };

    if (isEdit && service) {
      payload['id'] = service.id;
    }

    (dispatch as (p: unknown) => void)(payload);
  }

  // ── Render ─────────────────────────────────────────────────
  const catOptions = categories.map((c) => ({
    id:   c.id,
    name: resolveI18n(c.nameI18n, locale),
  }));

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        {/* Panel */}
        <Dialog.Content
          className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200"
          aria-describedby={undefined}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
            <div>
              <Dialog.Title className="font-cormorant text-lg font-semibold text-stone-800">
                {isEdit ? 'Editar Servicio' : 'Nuevo Servicio'}
              </Dialog.Title>
              <p className="text-[11px] text-stone-400 mt-0.5">
                Catálogo · {organizationId.slice(0, 8)}…
              </p>
            </div>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            {/* ── i18n Name & Description ──────────── */}
            <section>
              <p className="field-label mb-3">Nombre del servicio</p>

              {/* Language tabs */}
              <div className="flex gap-1 mb-3">
                {(['es','en','pt'] as const).map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setTab(l)}
                    className={[
                      'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                      tab === l
                        ? 'bg-stone-900 text-white'
                        : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                    ].join(' ')}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>

              <input
                id={`${id}-name-${tab}`}
                type="text"
                value={nameI18n[tab]}
                onChange={(e) => setNameI18n((p) => ({ ...p, [tab]: e.target.value }))}
                placeholder={`Nombre en ${tab === 'es' ? 'Español' : tab === 'en' ? 'English' : 'Português'}`}
                className="input-editorial w-full mb-3"
                required={tab === 'es'}
              />

              <textarea
                value={descI18n[tab]}
                onChange={(e) => setDescI18n((p) => ({ ...p, [tab]: e.target.value }))}
                placeholder="Descripción (opcional)"
                rows={2}
                className="input-editorial w-full resize-none text-sm"
              />
            </section>

            {/* ── Price + Duration ──────────────────── */}
            <section className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Precio (€)</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 text-sm">€</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    className="input-editorial w-full pl-4 tabular-nums"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="field-label">Duración (min)</label>
                <input
                  type="number"
                  min="1"
                  step="5"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="60"
                  className="input-editorial w-full mt-1.5 tabular-nums"
                  required
                />
              </div>
            </section>

            {/* ── Deposit % (Slider) ────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <label className="field-label">Depósito al reservar</label>
                <span className="text-sm font-bold tabular-nums text-amber-600">{deposit}%</span>
              </div>
              <Slider.Root
                min={0} max={100} step={5}
                value={[deposit]}
                onValueChange={([v]) => setDeposit(v ?? 100)}
                className="relative flex items-center w-full h-5"
              >
                <Slider.Track className="relative h-1 flex-1 bg-stone-200 rounded-full">
                  <Slider.Range className="absolute h-full bg-amber-400 rounded-full" />
                </Slider.Track>
                <Slider.Thumb
                  className="block w-4 h-4 bg-white border-2 border-amber-400 rounded-full shadow focus:outline-none focus:ring-2 focus:ring-amber-300"
                  aria-label="Deposit percent"
                />
              </Slider.Root>
              <p className="text-[10px] text-stone-400 mt-1">
                {deposit === 100 ? 'Pago completo al reservar' :
                 deposit === 0   ? 'Sin depósito (pago en cita)' :
                 `La clienta paga el ${deposit}% al reservar`}
              </p>
            </section>

            {/* ── Buffer times ──────────────────────── */}
            <section className="grid grid-cols-2 gap-4">
              <div>
                <label className="field-label">Buffer previo (min)</label>
                <input
                  type="number" min="0" step="5"
                  value={bufBefore}
                  onChange={(e) => setBufBefore(e.target.value)}
                  className="input-editorial w-full mt-1.5 tabular-nums"
                />
              </div>
              <div>
                <label className="field-label">Buffer posterior (min)</label>
                <input
                  type="number" min="0" step="5"
                  value={bufAfter}
                  onChange={(e) => setBufAfter(e.target.value)}
                  className="input-editorial w-full mt-1.5 tabular-nums"
                />
              </div>
            </section>

            {/* ── Category ──────────────────────────── */}
            <section>
              <label className="field-label">Categoría</label>
              <select
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
                className="input-editorial w-full mt-1.5"
              >
                <option value="">Sin categoría</option>
                {catOptions.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </section>

            {/* ── Color dot ────────────────────────── */}
            <section>
              <label className="field-label mb-2 block">Color en calendario</label>
              <div className="flex gap-2 flex-wrap">
                {COLOR_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c === color ? '' : c)}
                    className={[
                      'w-7 h-7 rounded-full transition-transform',
                      c === color ? 'scale-125 ring-2 ring-offset-2 ring-stone-400' : 'hover:scale-110',
                    ].join(' ')}
                    style={{ backgroundColor: c }}
                    aria-label={`Color ${c}`}
                  />
                ))}
                {color && (
                  <button
                    type="button"
                    onClick={() => setColor('')}
                    className="w-7 h-7 rounded-full bg-stone-100 text-stone-400 text-xs hover:bg-stone-200 transition-colors flex items-center justify-center"
                  >
                    ✕
                  </button>
                )}
              </div>
            </section>

            {/* ── Status toggle ─────────────────────── */}
            <section className="flex items-center justify-between py-3 border-t border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-700">Servicio activo</p>
                <p className="text-[11px] text-stone-400">Visible en la página de reservas</p>
              </div>
              <Switch.Root
                checked={isActive}
                onCheckedChange={setIsActive}
                className="relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-stone-200"
              >
                <Switch.Thumb className="inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
              </Switch.Root>
            </section>

          </form>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-stone-100 flex gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form={undefined}
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar cambios' : 'Crear servicio'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
