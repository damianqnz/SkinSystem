'use client';

import Link from 'next/link';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaymentMethodCardProps {
  stripeConnected: boolean;
  stripeAccountId: string | null;
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60  " fill="currentColor" className={className} aria-label="Stripe">
      <path fillRule="evenodd" clipRule="evenodd" d="M2 0a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zm6.226 5.385c-.584 0-.937.164-.937.593 0 .468.607.674 1.36.93 1.228.415 2.844.963 2.851 2.993C11.5 11.868 9.924 13 7.63 13a7.7 7.7 0 0 1-3.009-.626V9.758c.926.506 2.095.88 3.01.88.617 0 1.058-.165 1.058-.671 0-.518-.658-.755-1.453-1.041C6.026 8.49 4.5 7.94 4.5 6.11 4.5 4.165 5.988 3 8.226 3a7.3 7.3 0 0 1 2.734.505v2.583c-.838-.45-1.896-.703-2.734-.703" />
    </svg>
  );
}

export function PaymentMethodCard({ stripeConnected, stripeAccountId }: PaymentMethodCardProps) {
  const t = useTranslations('dashboard.billing.paymentMethod');

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center justify-between gap-4">
      {/* Logo + name */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#635BFF] flex items-center justify-center shrink-0">
          <StripeLogo className="w-8 text-white" />
        </div>
        <div>
          <p className="font-cormorant text-[16px] font-semibold text-stone-800">Stripe</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {stripeConnected && stripeAccountId
              ? t('accountMasked', { last6: stripeAccountId.slice(-6) })
              : t('platform')}
          </p>
        </div>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-3 shrink-0">
        {stripeConnected ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
              <CheckCircle2 size={11} />
              {t('connected')}
            </span>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title={t('stripeDashboard')}
            >
              <ExternalLink size={14} />
            </a>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-[11px] font-medium">
              <AlertCircle size={11} />
              {t('notConnected')}
            </span>
            <Link
              href="/dashboard/integrations"
              className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors"
            >
              {t('connect')}
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
