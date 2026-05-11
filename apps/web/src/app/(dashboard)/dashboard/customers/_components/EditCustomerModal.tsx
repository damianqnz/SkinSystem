'use client';

import { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X }       from 'lucide-react';
import { toast }   from 'sonner';
import { useTranslations } from 'next-intl';
import { updateCustomerAction } from '../actions/update-customer';

interface Props {
  open:     boolean;
  onClose:  () => void;
  locale:   string;
  customer: { id: string; fullName: string; email: string | null; phone: string | null; notes?: string | null };
}

const INPUT = 'w-full px-3 py-2 font-sans text-sm bg-white border border-stone-200 rounded-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors';
const LABEL = 'block font-sans text-[11px] uppercase tracking-wider text-stone-400 mb-1';

export function EditCustomerModal({ open, onClose, customer }: Props) {
  const t = useTranslations('dashboard.customers.editModal');
  const [fullName, setFullName] = useState(customer.fullName);
  const [email,    setEmail]    = useState(customer.email    ?? '');
  const [phone,    setPhone]    = useState(customer.phone    ?? '');
  const [notes,    setNotes]    = useState(customer.notes    ?? '');
  const [pending,  startSave]   = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startSave(async () => {
      const res = await updateCustomerAction({ id: customer.id, fullName, email: email || null, phone: phone || null, notes: notes || null });
      if (res.error) { toast.error(res.error.message); return; }
      toast.success(t('success'));
      onClose();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
          <div className="flex items-center justify-between mb-5">
            <Dialog.Title className="font-serif text-xl font-light text-stone-900">{t('title')}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 transition-colors"><X size={16} strokeWidth={1.5} /></button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={LABEL}>{t('name')} *</label>
              <input value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} maxLength={120} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>{t('email')}</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>{t('phone')}</label>
              <input value={phone} onChange={e => setPhone(e.target.value)} maxLength={30} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>{t('notes')}</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} maxLength={1000} className={`${INPUT} resize-none`} />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-sm border border-stone-200 font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors">{t('cancel')}</button>
              <button type="submit" disabled={pending || !fullName.trim()} className="flex-1 py-2.5 rounded-sm bg-stone-900 font-sans text-sm text-white hover:bg-stone-800 disabled:opacity-40 transition-colors">{pending ? t('saving') : t('save')}</button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
