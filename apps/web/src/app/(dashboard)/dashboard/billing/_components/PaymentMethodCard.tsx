'use client';

import Link from 'next/link';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StripeIcon } from '@/shared/components/icons/StripeIcon';

interface PaymentMethodCardProps {
  stripeConnected: boolean;
  stripeAccountId: string | null;
}

export function PaymentMethodCard({ stripeConnected, stripeAccountId }: PaymentMethodCardProps) {
  const t = useTranslations('dashboard.billing.paymentMethod');

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center justify-between gap-4">
      {/* Logo + name */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#635BFF] flex items-center justify-center shrink-0">
          <StripeIcon className="w-6 h-6 text-white" />
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
              href={stripeAccountId ? `https://dashboard.stripe.com/${stripeAccountId}` : 'https://dashboard.stripe.com'}
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
