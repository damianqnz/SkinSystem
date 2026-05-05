import Link from 'next/link';
import { headers } from 'next/headers';
import { ChevronLeft } from 'lucide-react';
import { StripeConnectModal } from '../_components/StripeConnectModal';
import { stripeT } from '../_i18n/stripe';

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
  const locale = hdrs.get('x-locale') ?? 'es';
  const t      = stripeT(locale);

  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        href="/dashboard/integrations"
        className="inline-flex items-center gap-1 text-xs text-stone-500 transition-colors hover:text-stone-800"
      >
        <ChevronLeft size={14} aria-hidden />
        {t.callback.backToIntegrations}
      </Link>
      <StripeConnectModal />
    </div>
  );
}
