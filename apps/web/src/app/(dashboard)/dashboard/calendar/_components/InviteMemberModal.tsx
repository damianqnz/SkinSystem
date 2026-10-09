'use client';

import { useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { inviteStaffAction } from '../../settings/team/actions';

interface InviteMemberModalProps {
  open:    boolean;
  onClose: () => void;
}

/**
 * Owner-only invite dialog, driven from the calendar "+" quick-actions menu.
 * Reuses the established `inviteStaffAction` and the `dashboard.settings.team`
 * wording so the calendar and settings flows stay identical.
 */
export function InviteMemberModal({ open, onClose }: InviteMemberModalProps) {
  const t = useTranslations('dashboard.settings.team');
  const [email, setEmail] = useState('');
  const [role,  setRole]  = useState<'staff' | 'owner'>('staff');
  const [pending, startTransition] = useTransition();

  function reset() {
    setEmail('');
    setRole('staff');
  }

  function handleClose() {
    if (pending) return;
    reset();
    onClose();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pending) return;
    startTransition(async () => {
      const res = await inviteStaffAction({ email, role });
      if (res.error) {
        toast.error(res.error.message);
        return;
      }
      toast.success(t('successInviteSent', { email }));
      reset();
      onClose();
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content
          className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100%-2rem)] max-w-md"
          aria-describedby={undefined}
        >
          <div className="rounded-xl bg-white/85 backdrop-blur-xl border border-stone-200/60 shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <Dialog.Title className="font-cormorant text-xl font-semibold text-stone-800">
                {t('inviteMember')}
              </Dialog.Title>
              <Dialog.Close asChild>
                <button className="p-1.5 rounded-lg hover:bg-stone-100 transition-colors text-stone-400">
                  <X size={16} />
                </button>
              </Dialog.Close>
            </div>

            <form onSubmit={handleSubmit} className="px-5 pb-5 space-y-4">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('emailPlaceholder')}
                aria-label={t('emailPlaceholder')}
                autoFocus
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700
                           placeholder:text-stone-400 focus:outline-none focus:border-amber-300
                           focus:ring-1 focus:ring-amber-200 transition-colors"
              />

              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'staff' | 'owner')}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-700
                           bg-white focus:outline-none focus:border-amber-300 focus:ring-1
                           focus:ring-amber-200 transition-colors appearance-none"
              >
                <option value="staff">{t('roleStaff')}</option>
                <option value="owner">{t('roleOwner')}</option>
              </select>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={pending}
                  className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-xl transition-colors disabled:opacity-60"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={pending || !email}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white
                             text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
                >
                  {pending && <Loader2 size={13} className="animate-spin" />}
                  {t('sendInvite')}
                </button>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
