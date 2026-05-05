'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import {
  STRIPE_CONNECT_MESSAGE_TYPE,
  type StripeConnectMessage,
} from './StripeConnectListener';

export interface StripeNewTabBannerProps {
  visible:     boolean;
  title:       string;
  description: string;
}

/**
 * Banner shown while Stripe onboarding is open in a separate tab.
 * Auto-dismisses when the callback page posts the completion message,
 * mirroring the listener's origin check so it ignores spoofed events.
 */
export function StripeNewTabBanner({ visible, title, description }: StripeNewTabBannerProps) {
  const [show, setShow] = useState(visible);

  // Sync external prop changes.
  useEffect(() => { setShow(visible); }, [visible]);

  useEffect(() => {
    function handle(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as Partial<StripeConnectMessage> | undefined;
      if (data?.type === STRIPE_CONNECT_MESSAGE_TYPE) setShow(false);
    }
    window.addEventListener('message', handle);
    return () => window.removeEventListener('message', handle);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          role="status"
          aria-live="polite"
          className="mb-4 flex items-start gap-3 rounded-xl border border-amber-100
                     bg-amber-50 px-4 py-3 text-sm text-amber-800"
        >
          <ExternalLink size={14} className="mt-0.5 shrink-0 text-amber-500" aria-hidden />
          <div className="flex-1 min-w-0">
            <p className="font-medium leading-tight">{title}</p>
            <p className="mt-0.5 text-xs leading-relaxed text-amber-700">{description}</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
