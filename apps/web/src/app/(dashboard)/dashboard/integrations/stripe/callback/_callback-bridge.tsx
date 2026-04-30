'use client';

import { useEffect } from 'react';
import { STRIPE_CONNECT_MESSAGE_TYPE } from '../../_components/StripeConnectListener';

interface StripeCallbackBridgeProps {
  status: 'success' | 'refresh';
}

/**
 * Posts the completion event back to the parent tab and tries to close
 * itself. Falls through silently when there's no `window.opener` (deep
 * link / refresh inside the popup) — the parent page renders the visible
 * fallback instead.
 */
export function StripeCallbackBridge({ status }: StripeCallbackBridgeProps) {
  useEffect(() => {
    const opener = window.opener as Window | null;
    if (opener && !opener.closed) {
      try {
        opener.postMessage(
          { type: STRIPE_CONNECT_MESSAGE_TYPE, status },
          window.location.origin,
        );
      } catch {
        // Ignore — opener may be cross-origin (shouldn't happen for our
        // own routes, but be defensive).
      }
      // Browsers only allow window.close() on tabs they themselves opened,
      // which matches our popup flow. The fallback UI covers the rest.
      window.close();
    }
  }, [status]);

  return null;
}
