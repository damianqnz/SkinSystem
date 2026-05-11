import { Suspense }                from 'react';
import { headers }                 from 'next/headers';
import { notFound }                from 'next/navigation';
import { eq }                      from 'drizzle-orm';
import { getTranslations }         from 'next-intl/server';
import { getOrganizationBySlug }   from '@/domains/organizations/service';
import { getOrganizationSettings } from '@/domains/organizations/service';
import { db }                      from '@/infrastructure/db';
import { bookingSettings }         from '@/domains/booking/schema';
import { PaymentMethodCard }       from './_components/PaymentMethodCard';
import { PaymentSettings }         from './_components/PaymentSettings';
import { PaymentHistoryTable }     from './_components/PaymentHistoryTable';
import { SurchargesSection }       from './_components/SurchargesSection';
import { CouponsSection }          from './_components/CouponsSection';
import { getSurchargesAction }     from './actions-surcharges';
import { getCouponsAction }        from './actions-coupons';

/**
 * /dashboard/billing — Payments management
 *
 * Sections:
 *   1. Active payment method (Stripe connection status)
 *   2. Payment toggles (online payment enabled, advance required)
 *   3. Surcharges & reductions
 *   4. Coupons
 *   5. Payment history table with date range filter + CSV export
 */
export default async function BillingPage() {
  return (
    <Suspense fallback={<BillingSkeleton />}>
      <BillingContent />
    </Suspense>
  );
}

async function BillingContent() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'pt';

  const t = await getTranslations({ locale, namespace: 'dashboard.billing' });

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  const [settingsResult, bsRows, surchargesResult, couponsResult] = await Promise.all([
    getOrganizationSettings(org.id),
    db.select({
      onlinePaymentEnabled:   bookingSettings.onlinePaymentEnabled,
      advancePaymentRequired: bookingSettings.advancePaymentRequired,
    })
    .from(bookingSettings)
    .where(eq(bookingSettings.organizationId, org.id))
    .limit(1),
    getSurchargesAction(),
    getCouponsAction(),
  ]);

  const settings        = settingsResult.data;
  const stripeConnected = !!(settings?.stripeAccountId && settings.stripeOnboarded);
  const bs              = bsRows[0];

  const sectionError = t('sectionError');

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('title')}</h1>
        <p className="text-sm text-stone-400 mt-1">{t('description')}</p>
      </div>

      {/* Section: Payment method */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          {t('sectionPaymentMethod')}
        </h2>
        <PaymentMethodCard
          stripeConnected={stripeConnected}
          stripeAccountId={settings?.stripeAccountId ?? null}
        />
      </section>

      {/* Section: Payment page settings */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
            {t('sectionPaymentSettings')}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {t('sectionPaymentSettingsDesc')}
          </p>
        </div>
        <PaymentSettings
          onlinePaymentEnabled={bs?.onlinePaymentEnabled ?? false}
          advancePaymentRequired={bs?.advancePaymentRequired ?? false}
        />
      </section>

      {/* Section: Surcharges & reductions */}
      {surchargesResult.error ? (
        <SectionError
          title={t('surcharges.sectionTitle')}
          message={surchargesResult.error.message}
          supportMsg={sectionError}
        />
      ) : (
        <SurchargesSection initial={surchargesResult.data} />
      )}

      {/* Section: Coupons */}
      {couponsResult.error ? (
        <SectionError
          title={t('coupons.sectionTitle')}
          message={couponsResult.error.message}
          supportMsg={sectionError}
        />
      ) : (
        <CouponsSection initial={couponsResult.data} />
      )}

      {/* Section: Payment history */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
            {t('sectionHistory')}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {t('sectionHistoryDesc')}
          </p>
        </div>
        <PaymentHistoryTable />
      </section>
    </div>
  );
}

function SectionError({ title, message, supportMsg }: { title: string; message: string; supportMsg: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">{title}</h2>
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
        <p className="text-sm text-rose-700">{message}</p>
        <p className="text-xs text-rose-500 mt-1">{supportMsg}</p>
      </div>
    </section>
  );
}

function BillingSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-32 bg-stone-100 rounded-lg" />
        <div className="h-4 w-64 bg-stone-100 rounded" />
      </div>
      {[1, 2, 3, 4, 5].map((s) => (
        <div key={s} className="space-y-3">
          <div className="h-3 w-36 bg-stone-100 rounded" />
          <div className="h-16 bg-stone-100 rounded-2xl" />
          {s === 5 && <div className="h-48 bg-stone-100 rounded-2xl" />}
        </div>
      ))}
    </div>
  );
}
