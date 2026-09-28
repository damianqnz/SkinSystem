'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Physical rooms are not modelled yet; the Adicionar menu says so instead of hiding the entry. */
export function RoomComingSoonModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('dashboard.catalog');

  return (
    <Dialog.Root open={open} onOpenChange={(o) => !o && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/25 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-6 shadow-2xl"
          aria-describedby={undefined}
        >
          <div className="flex items-start justify-between mb-3">
            <Dialog.Title className="font-cormorant text-lg font-semibold text-stone-800">
              {t('roomsComingSoonTitle')}
            </Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1 rounded-lg hover:bg-stone-100 text-stone-400" aria-label={t('close')}>
                <X size={16} />
              </button>
            </Dialog.Close>
          </div>
          <p className="text-sm text-stone-500 mb-5">{t('roomsComingSoonDesc')}</p>
          <button
            onClick={onClose}
            className="w-full min-h-11 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            {t('close')}
          </button>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
