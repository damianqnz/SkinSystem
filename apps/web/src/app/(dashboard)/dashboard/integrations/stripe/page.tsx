import Link from 'next/link';
import { headers } from 'next/headers';
import { ChevronLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { StripeConnectModal } from '../_components/StripeConnectModal';

/**
 * Full-page Stripe Connect view.
 *
 * Reached only on direct navigation (deep link / hard reload). Soft
 * navigations from the integrations list go through the intercepted
 * modal at `@modal/(.)stripe/page.tsx`. Both routes render the same
 * server component so DB state stays the single source of truth.
 */
export default async function StripeConnectFullPage() {
  const hdrs   = await headers();
  const locale = hdrs.get('x-locale') ?? 'pt';
  const t      = await getTranslations({ locale, namespace: 'integrations.stripe' });

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/dashboard/integrations"
        className="inline-flex items-center gap-1 text-xs text-stone-500 transition-colors hover:text-stone-800"
      >
        <ChevronLeft size={14} aria-hidden />
        {t('callback.backToIntegrations')}
      </Link>
      <StripeConnectModal />
    </div>
  );
}
