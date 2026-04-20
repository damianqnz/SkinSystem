'use client';

import { useState, useTransition } from 'react';
import { useRouter }   from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as AlertDialog  from '@radix-ui/react-alert-dialog';
import { MoreHorizontal, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
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
  const router  = useRouter();
  const [deleteOpen,    setDeleteOpen]   = useState(false);
  const [blockPending,  startBlock]      = useTransition();
  const [deletePending, startDelete]     = useTransition();

  function handleToggleBlock() {
    startBlock(async () => {
      const res = await toggleBlockCustomerAction(customerId);
      if (res.error) { toast.error(res.error.message); return; }
      onBlockToggled(res.data!.isBlocked);
      const msg = res.data!.isBlocked
        ? (locale === 'pt' ? 'Cliente bloqueado' : locale === 'en' ? 'Client blocked' : 'Cliente bloqueado')
        : (locale === 'pt' ? 'Cliente desbloqueado' : locale === 'en' ? 'Client unblocked' : 'Cliente desbloqueado');
      toast.success(msg);
    });
  }

  function handleDelete() {
    startDelete(async () => {
      const res = await deleteCustomerAction(customerId);
      if (res.error) { toast.error(res.error.message); setDeleteOpen(false); return; }
      toast.success(locale === 'pt' ? 'Cliente eliminado' : locale === 'en' ? 'Client deleted' : 'Cliente eliminado');
      router.push('/dashboard/customers');
    });
  }

  const blockLabel  = isBlocked
    ? (locale === 'pt' ? 'Desbloquear cliente' : locale === 'en' ? 'Unblock client'  : 'Desbloquear cliente')
    : (locale === 'pt' ? 'Bloquear cliente'    : locale === 'en' ? 'Block client'     : 'Bloquear cliente');
  const deleteLabel = locale === 'pt' ? 'Eliminar cliente' : locale === 'en' ? 'Delete client' : 'Eliminar cliente';
  const confirmMsg  = locale === 'pt' ? `Eliminar ${fullName}? Esta ação não pode ser desfeita.`
    : locale === 'en' ? `Delete ${fullName}? This action cannot be undone.`
    : `¿Eliminar a ${fullName}? Esta acción no se puede deshacer.`;

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button className="p-2 rounded-md hover:bg-stone-50 text-stone-400 transition-colors" aria-label="Opciones">
            <MoreHorizontal size={14} strokeWidth={1.5} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content align="end" sideOffset={4}
            className="z-50 w-52 bg-white rounded-sm shadow-lg border border-stone-100 py-1 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-150">
            <DropdownMenu.Item onSelect={handleToggleBlock} disabled={blockPending}
              className={cn('flex items-center gap-2 px-3 py-2 font-sans text-sm cursor-pointer outline-none transition-colors hover:bg-stone-50', isBlocked ? 'text-emerald-700' : 'text-stone-700')}>
              {isBlocked ? <ShieldCheck size={14} strokeWidth={1.5} /> : <ShieldOff size={14} strokeWidth={1.5} />}
              {blockLabel}
            </DropdownMenu.Item>
            <DropdownMenu.Separator className="h-px bg-stone-100 mx-2 my-0.5" />
            <DropdownMenu.Item onSelect={() => setDeleteOpen(true)}
              className="flex items-center gap-2 px-3 py-2 font-sans text-sm text-rose-600 cursor-pointer outline-none hover:bg-rose-50 transition-colors">
              <Trash2 size={14} strokeWidth={1.5} />
              {deleteLabel}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <AlertDialog.Root open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
          <AlertDialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200">
            <AlertDialog.Title className="font-serif text-xl font-light text-stone-900 mb-2">
              {locale === 'pt' ? 'Eliminar cliente' : locale === 'en' ? 'Delete client' : 'Eliminar cliente'}
            </AlertDialog.Title>
            <AlertDialog.Description className="font-sans text-sm text-stone-500 mb-6">{confirmMsg}</AlertDialog.Description>
            <div className="flex gap-2">
              <AlertDialog.Cancel asChild>
                <button className="flex-1 py-2.5 rounded-sm border border-stone-200 font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                  {locale === 'pt' ? 'Cancelar' : locale === 'en' ? 'Cancel' : 'Cancelar'}
                </button>
              </AlertDialog.Cancel>
              <AlertDialog.Action asChild>
                <button onClick={handleDelete} disabled={deletePending}
                  className="flex-1 py-2.5 rounded-sm bg-rose-600 font-sans text-sm text-white hover:bg-rose-700 disabled:opacity-40 transition-colors">
                  {locale === 'pt' ? 'Eliminar' : locale === 'en' ? 'Delete' : 'Eliminar'}
                </button>
              </AlertDialog.Action>
            </div>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog.Root>
    </>
  );
}
