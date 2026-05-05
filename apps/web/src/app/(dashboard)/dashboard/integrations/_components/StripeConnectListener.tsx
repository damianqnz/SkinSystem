'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { toast }     from 'sonner';

export interface StripeConnectListenerProps {
  /** Notification copy for the success toast. */
  successToast: string;
  /** Notification copy for the link-expired toast. */
  refreshToast: string;
}

export const STRIPE_CONNECT_MESSAGE_TYPE = 'stripe-connect-completed';

export interface StripeConnectMessage {
  type:   typeof STRIPE_CONNECT_MESSAGE_TYPE;
  status: 'success' | 'refresh';
}

/**
 * Listens for postMessage events fired by the Stripe callback page when the
 * user finishes (or aborts) onboarding in the popup tab. Validates the origin
 * matches our own to reject spoofed messages, then triggers a router refresh
 * so the parent server component re-reads `stripeOnboarded` from the DB.
 */
export function StripeConnectListener({ successToast, refreshToast }: StripeConnectListenerProps) {
  const router = useRouter();

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as Partial<StripeConnectMessage> | undefined;
      if (!data || data.type !== STRIPE_CONNECT_MESSAGE_TYPE) return;

      if (data.status === 'success') toast.success(successToast);
      else                           toast.info(refreshToast);

      router.refresh();
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [router, successToast, refreshToast]);

  return null;
}
