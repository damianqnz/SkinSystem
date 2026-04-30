'use client';

import { type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

/**
 * Floating shell for the intercepted Stripe modal.
 * Closing the dialog (Esc / overlay click / X button) calls `router.back()`
 * so the URL transitions back to `/dashboard/integrations` without
 * remounting the integrations list — matching Next.js's recommended
 * Parallel + Intercepting Routes flow.
 */
export function StripeRouteModalShell({ children }: { children: ReactNode }) {
  const router = useRouter();

  function handleClose(open: boolean) {
    if (!open) router.back();
  }

  return (
    <Dialog.Root open onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px]
                     data-[state=open]:animate-in data-[state=closed]:animate-out
                     data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                     duration-200"
        />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
        >
          <div
            className="relative w-full max-w-xl
                       data-[state=open]:animate-in data-[state=closed]:animate-out
                       data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0
                       data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95
                       duration-200"
          >
            <Dialog.Close
              className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-stone-400
                         transition-colors hover:bg-stone-100 hover:text-stone-700
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
              aria-label="Close"
            >
              <X size={16} aria-hidden />
            </Dialog.Close>
            {/* Title is required by Radix for a11y; we render an off-screen one
                because the StripeConnectModal already has its own visible <h2>. */}
            <Dialog.Title className="sr-only">Stripe Connect</Dialog.Title>
            {children}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
