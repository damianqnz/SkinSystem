'use client';

import { useState, useTransition } from 'react';
import { useRouter }   from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as AlertDialog  from '@radix-ui/react-alert-dialog';
import { MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { toggleBlockCustomerAction } from '../../actions/toggle-block-customer';
import { deleteCustomerAction }      from '../../actions/delete-customer';
import { cn } from '@/shared/lib/utils';

interface Props {
  customerId:  string;
  fullName:    string;
  locale:      string;
  isBlocked:   boolean;
  onBlockToggled: (next: boolean) => void;
}

export function CustomerActionsMenu({ customerId, fullName, locale, isBlocked, onBlockToggled }: Props) {
  const t       = useTranslations('dashboard.customers.actions');
  const router  = useRouter();
  const [deleteOpen,    setDeleteOpen]   = useState(false);
  const [blockPending,  startBlock]      = useTransition();
  const [deletePending, startDelete]     = useTransition();

  function handleToggleBlock() {
    startBlock(async () => {
      const res = await toggleBlockCustomerAction(customerId);
      if (res.error) { toast.error(res.error.message); return; }
      onBlockToggled(res.data!.isBlocked);
      toast.success(res.data!.isBlocked ? t('toastBlocked') : t('toastUnblocked'));
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteCustomerAction(customerId);
      if (res.error) { toast.error(res.error.message); setDeleteOpen(false); return; }
      toast.success(t('toastDeleted'));
      router.push('/dashboard/customers');
    });
  }

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 transition-colors" aria-label={t('optionsAriaLabel')}>
            <MoreHorizontal size={14} strokeWidth={1.5} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4}
            className="z-50 w-52 bg-white rounded-sm shadow-lg border border-stone-100 py-1 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-150">
            <DropdownMenu.Item onSelect={handleToggleBlock} disabled={blockPending}
              className={cn('flex items-center gap-2 px-3 py-2 font-sans text-sm cursor-pointer outline-none transition-colors hover:bg-stone-50', isBlocked ? 'text-emerald-700' : 'text-stone-700')}>
              {isBlocked ? <ShieldCheck size={14} strokeWidth={1.5} /> : <ShieldOff size={14} strokeWidth={1.5} />}
              {isBlocked ? t('unblockLabel') : t('blockLabel')}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-stone-100 mx-2 my-0.5" />
            <DropdownMenu.Item onSelect={() => setDeleteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 font-sans text-sm text-rose-600 cursor-pointer outline-none hover:bg-rose-50 transition-colors">
              <Trash2 size={14} strokeWidth={1.5} />
              {t('deleteLabel')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
          <AlertDialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            <AlertDialog.Title className="font-serif text-xl font-light text-stone-900 mb-2">
              {t('confirmTitle')}
            </AlertDialog.Title>
            <AlertDialog.Description className="font-sans text-sm text-stone-500 mb-6">
              {t('confirmDesc', { name: fullName })}
            </AlertDialog.Description>
            <div className="flex gap-2">
              <AlertDialog.Cancel asChild>
                <button className="flex-1 py-2.5 rounded-sm border border-stone-200 font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                  {t('cancelBtn')}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button onClick={handleDelete} disabled={deletePending}
                  className="flex-1 py-2.5 rounded-sm bg-rose-600 font-sans text-sm text-white hover:bg-rose-700 disabled:opacity-40 transition-colors">
                  {t('deleteBtn')}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
