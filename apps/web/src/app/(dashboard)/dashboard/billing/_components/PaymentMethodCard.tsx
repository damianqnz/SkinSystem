'use client';

import Link from 'next/link';
import { CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

interface PaymentMethodCardProps {
  stripeConnected: boolean;
  stripeAccountId: string | null;
}

function StripeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 60 25" fill="currentColor" className={className} aria-label="Stripe">
      <path fillRule="evenodd" clipRule="evenodd" d="M5.45 9.43c0-.79.65-1.09 1.72-1.09 1.54 0 3.48.47 5.02 1.3V5.27C10.6 4.63 9.04 4.4 7.17 4.4 3.07 4.4.49 6.55.49 9.63c0 4.79 6.6 4.02 6.6 6.08 0 .93-.81 1.24-1.94 1.24-1.68 0-3.84-.69-5.54-1.62v4.44c1.88.81 3.79 1.15 5.54 1.15C8.53 20.92 12 19 12 15.47c-.01-5.17-6.55-4.25-6.55-6.04zm15.79-4.68l-3.91.83v2.83l-1.6.34v3.11l1.6-.34v5.71c0 2.9 1.54 3.97 3.86 3.97 1.06 0 2.05-.2 2.87-.55v-3.3a6.03 6.03 0 01-1.48.18c-.62 0-1.34-.18-1.34-1.33V11.52l2.82-.6V7.8l-2.82.6V4.75zm9.88 1.93l-.24-1.36h-3.56v15.3h3.98V9.68c.94-1.23 2.52-1.01 3.03-.83V5.32c-.54-.19-2.52-.54-3.21 1.36zm4.63-1.36h4v15.3h-4V5.32zm2-4.27c-1.26 0-2.29 1.03-2.29 2.3 0 1.26 1.03 2.29 2.29 2.29 1.27 0 2.3-1.03 2.3-2.29 0-1.27-1.03-2.3-2.3-2.3zm11.36 4.27l-3.91.83v2.83l-1.6.34v3.11l1.6-.34v5.71c0 2.9 1.54 3.97 3.86 3.97 1.06 0 2.05-.2 2.87-.55v-3.3a6.03 6.03 0 01-1.48.18c-.62 0-1.34-.18-1.34-1.33V11.52l2.82-.6V7.8l-2.82.6V5.32z"/>
    </svg>
  );
}

export function PaymentMethodCard({ stripeConnected, stripeAccountId }: PaymentMethodCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 flex items-center justify-between gap-4">
      {/* Logo + name */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-[#635BFF] flex items-center justify-center flex-shrink-0">
          <StripeLogo className="w-8 text-white" />
        </div>
        <div>
          <p className="font-cormorant text-[16px] font-semibold text-stone-800">Stripe</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {stripeConnected && stripeAccountId
              ? `Conta ••••${stripeAccountId.slice(-6)}`
              : 'Plataforma de pagamentos'}
          </p>
        </div>
      </div>

      {/* Status + action */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {stripeConnected ? (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-medium">
              <CheckCircle2 size={11} />
              Conectado
            </span>
            <a
              href="https://dashboard.stripe.com"
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors"
              title="Dashboard Stripe"
            >
              <ExternalLink size={14} />
            </a>
          </>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-stone-100 text-stone-500 text-[11px] font-medium">
              <AlertCircle size={11} />
              Não conectado
            </span>
            <Link
              href="/dashboard/integrations"
              className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors"
            >
              Conectar
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
