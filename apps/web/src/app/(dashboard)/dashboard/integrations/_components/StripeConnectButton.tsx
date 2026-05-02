'use client';

import { useActionState, useEffect, startTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import {
  createStripeConnectAccount,
  refreshStripeOnboardingLink,
  type StripeConnectState,
} from '@/domains/billing/actions/stripe-connect';

const IDLE: StripeConnectState = { status: 'idle' };

export type StripeConnectButtonVariant = 'connect' | 'continue';

export interface StripeConnectButtonProps {
  variant:        StripeConnectButtonVariant;
  labelIdle:      string;
  labelLoading:   string;
  popupBlockedMsg:string;
  errorPrefix?:   string;
  /** Notifies the parent that a popup is open so it can show the banner. */
  onPopupOpened?: () => void;
}

/**
 * Single source of truth for the two onboarding entry points (initial
 * connect + refresh expired link). The variant flips which Server Action
 * is bound — copy is injected by the parent so i18n stays at the call site.
 */
export function StripeConnectButton({
  variant,
  labelIdle,
  labelLoading,
  popupBlockedMsg,
  errorPrefix,
  onPopupOpened,
}: StripeConnectButtonProps) {
  const router = useRouter();
  const action = variant === 'connect' ? createStripeConnectAccount : refreshStripeOnboardingLink;

  const [state, dispatch, isPending] =
    useActionState<StripeConnectState, unknown>(action, IDLE);

  // Drive the side-effect from the action result.
  useEffect(() => {
    if (state.status === 'error') {
      toast.error(errorPrefix ? `${errorPrefix}: ${state.message}` : state.message);
      return;
    }
    if (state.status !== 'redirect') return;

    const popup = window.open(state.url, '_blank', 'noopener,noreferrer');
    if (popup) {
      onPopupOpened?.();
    } else {
      toast.info(popupBlockedMsg);
      router.push(state.url);
    }
  }, [state, router, popupBlockedMsg, errorPrefix, onPopupOpened]);

  const Icon = variant === 'connect' ? ArrowRight : RefreshCw;

  return (
    <button
      type="button"
      onClick={() => startTransition(() => (dispatch as (p: unknown) => void)(null))}
      disabled={isPending}
      className="group inline-flex w-full items-center justify-center gap-2 rounded-xl
                 bg-stone-900 px-5 py-3 text-sm font-medium text-white
                 transition-colors hover:bg-stone-800
                 disabled:cursor-not-allowed disabled:opacity-60
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
    >
      {isPending ? (
        <>
          <Loader2 size={15} className="animate-spin" aria-hidden />
          <span>{labelLoading}</span>
        </>
      ) : (
        <>
          <Icon size={15} aria-hidden />
          <span>{labelIdle}</span>
        </>
      )}
    </button>
  );
}
