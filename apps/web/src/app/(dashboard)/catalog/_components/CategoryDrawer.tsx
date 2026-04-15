'use client';

import { useEffect, useActionState, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Switch from '@radix-ui/react-switch';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createCategoryAction, updateCategoryAction } from '../actions';
import type { CatalogActionState } from '../actions';
import type { CategoryWithServices } from '@/domains/catalog/service';

interface CategoryDrawerProps {
  open:      boolean;
  onClose:   () => void;
  onSuccess: () => void;
  category?: Pick<CategoryWithServices, 'id' | 'nameI18n' | 'descriptionI18n' | 'isActive'> | null;
}

type I18n = { es: string; en: string; pt: string };

const IDLE: CatalogActionState = { status: 'idle' };

export function CategoryDrawer({ open, onClose, onSuccess, category }: CategoryDrawerProps) {
  const isEdit = !!category;

  const [nameI18n, setNameI18n] = useState<I18n>({ es: '', en: '', pt: '' });
  const [descI18n, setDescI18n] = useState<I18n>({ es: '', en: '', pt: '' });
  const [isActive, setIsActive] = useState(true);
  const [tab, setTab]           = useState<'es' | 'en' | 'pt'>('es');

  useEffect(() => {
    if (open) {
      if (category) {
        const n = category.nameI18n as Record<string, string>;
        const d = category.descriptionI18n as Record<string, string>;
        setNameI18n({ es: n['es'] ?? '', en: n['en'] ?? '', pt: n['pt'] ?? '' });
        setDescI18n({ es: d['es'] ?? '', en: d['en'] ?? '', pt: d['pt'] ?? '' });
        setIsActive(category.isActive);
      } else {
        setNameI18n({ es: '', en: '', pt: '' });
        setDescI18n({ es: '', en: '', pt: '' });
        setIsActive(true);
        setTab('es');
      }
    }
  }, [open, category]);

  const action = isEdit ? updateCategoryAction : createCategoryAction;
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const payload: Record<string, unknown> = { nameI18n, descriptionI18n: descI18n, isActive };
    if (isEdit && category) payload['id'] = category.id;
    (dispatch as (p: unknown) => void)(payload);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

        <Dialog.Content
          className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-white shadow-2xl flex flex-col data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right duration-200"
          aria-describedby={undefined}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 flex-shrink-0">
            <Dialog.Title className="font-cormorant text-lg font-semibold text-stone-800">
              {isEdit ? 'Editar Categoría' : 'Nueva Categoría'}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

            <section>
              <p className="field-label mb-3">Nombre de categoría</p>
              <div className="flex gap-1 mb-3">
                {(['es','en','pt'] as const).map((l) => (
                  <button
                    key={l} type="button"
                    onClick={() => setTab(l)}
                    className={[
                      'px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors',
                      tab === l ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200',
                    ].join(' ')}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={nameI18n[tab]}
                onChange={(e) => setNameI18n((p) => ({ ...p, [tab]: e.target.value }))}
                placeholder={`Ej: Faciales, Peinados…`}
                className="input-editorial w-full mb-3"
                required={tab === 'es'}
              />
              <textarea
                value={descI18n[tab]}
                onChange={(e) => setDescI18n((p) => ({ ...p, [tab]: e.target.value }))}
                placeholder="Descripción breve (opcional)"
                rows={2}
                className="input-editorial w-full resize-none text-sm"
              />
            </section>

            <section className="flex items-center justify-between py-3 border-t border-stone-100">
              <div>
                <p className="text-sm font-medium text-stone-700">Categoría activa</p>
                <p className="text-[11px] text-stone-400">Aparece en la página de reservas</p>
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

          <div className="px-6 py-4 border-t border-stone-100 flex gap-3 flex-shrink-0">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit as unknown as React.MouseEventHandler<HTMLButtonElement>}
              disabled={isPending}
              className="flex-1 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isEdit ? 'Guardar' : 'Crear categoría'}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
