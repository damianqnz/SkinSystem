import { headers } from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { StripeCallbackBridge } from './_callback-bridge';

interface StripeCallbackPageProps {
  searchParams: Promise<{ status?: string }>;
}

/**
 * /dashboard/integrations/stripe/callback
 *
 * Loaded inside the popup tab Stripe redirected to. The client bridge fires
 * a `postMessage` back to `window.opener`, then attempts to close the tab.
 * If the tab can't be closed (e.g. opened directly), we render a graceful
 * fallback with a link back to the integrations page.
 */
export default async function StripeCallbackPage({ searchParams }: StripeCallbackPageProps) {
  const params = await searchParams;
  const status = params.status === 'refresh' ? 'refresh' : 'success';

  const hdrs   = await headers();
  const locale = hdrs.get('x-locale') ?? 'pt';
  const t      = await getTranslations({ locale, namespace: 'integrations.stripe' });

  const heading = status === 'success' ? t('callback.successTitle') : t('callback.refreshTitle');
  const body    = status === 'success' ? t('callback.successBody')  : t('callback.refreshBody');

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center text-center">
      <StripeCallbackBridge status={status} />

      <h1 className="font-cormorant text-2xl font-semibold text-stone-800">
        {heading}
      </h1>
      <p className="mt-3 text-sm leading-relaxed text-stone-500">{body}</p>

      <a
        href="/dashboard/integrations"
        className="mt-6 inline-flex items-center justify-center rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-medium text-white
                   transition-colors hover:bg-stone-800
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
      >
        {t('callback.backToIntegrations')}
      </a>
    </div>
  );
}
