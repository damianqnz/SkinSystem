'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Loader2, Unlink } from 'lucide-react';
import { toast } from 'sonner';
import { disconnectStripeAccount } from '@/domains/billing/actions/stripe-connect';

export interface StripeDisconnectDialogLabels {
  trigger:        string;
  title:          string;
  description:    string;
  confirm:        string;
  loading:        string;
  cancel:         string;
  success:        string;
  errorForbidden: string;
  errorGeneric:   string;
}

export interface StripeDisconnectDialogProps {
  labels: StripeDisconnectDialogLabels;
}

/**
 * Owner-only Soft Disconnect confirmation. The actual permission check
 * lives in `disconnectStripeAccount`; the dialog is just the UX seatbelt.
 */
export function StripeDisconnectDialog({ labels }: StripeDisconnectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    startTransition(async () => {
      const result = await disconnectStripeAccount();
      if (result.error) {
        const msg = result.error.code === 'FORBIDDEN' ? labels.errorForbidden : labels.errorGeneric;
        toast.error(msg);
        return;
      }
      toast.success(labels.success);
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <AlertDialog.Root open={open} onOpenChange={setOpen}>
      <AlertDialog.Trigger asChild>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200
                     bg-white px-4 py-2.5 text-xs font-medium text-stone-600
                     transition-colors hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
        >
          <Unlink size={13} aria-hidden />
          {labels.trigger}
        </button>
      </AlertDialog.Trigger>

      <AlertDialog.Portal>
        <AlertDialog.Overlay
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px]
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                     duration-200"
        />
        <AlertDialog.Content
          className="fixed left-1/2 top-1/2 z-[60] w-[min(440px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2
                     rounded-2xl bg-white p-6 shadow-2xl focus:outline-none
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                     data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
                     duration-200"
        >
          <AlertDialog.Title className="font-cormorant text-xl font-semibold text-stone-900">
            {labels.title}
          </AlertDialog.Title>
          <AlertDialog.Description className="mt-2 text-sm leading-relaxed text-stone-500">
            {labels.description}
          </AlertDialog.Description>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <AlertDialog.Cancel asChild>
              <button
                type="button"
                className="rounded-xl border border-stone-200 px-4 py-2.5 text-sm text-stone-600
                           transition-colors hover:bg-stone-50
                           focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-300"
              >
                {labels.cancel}
              </button>
            </AlertDialog.Cancel>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isPending}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5
                         text-sm font-medium text-white transition-colors hover:bg-rose-700
                         disabled:cursor-not-allowed disabled:opacity-60
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            >
              {isPending && <Loader2 size={14} className="animate-spin" aria-hidden />}
              {isPending ? labels.loading : labels.confirm}
            </button>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  );
}
