import { Suspense }                from 'react';
import { headers }                 from 'next/headers';
import { notFound }                from 'next/navigation';
import { eq }                      from 'drizzle-orm';
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

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">Pagamentos</h1>
        <p className="text-sm text-stone-400 mt-1">Configure e gerencie os pagamentos das reservas.</p>
      </div>

      {/* Section: Payment method */}
      <section className="space-y-3">
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          Método de pagamento
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
            Pagamento na página de reservas
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Gere a forma como os clientes podem pagar os seus serviços.
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
          title="Taxas e reduções"
          message={surchargesResult.error.message}
        />
      ) : (
        <SurchargesSection initial={surchargesResult.data} />
      )}

      {/* Section: Coupons */}
      {couponsResult.error ? (
        <SectionError
          title="Cupões de desconto"
          message={couponsResult.error.message}
        />
      ) : (
        <CouponsSection initial={couponsResult.data} />
      )}

      {/* Section: Payment history */}
      <section className="space-y-3">
        <div>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
            Histórico de pagamentos
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            Consulta e exporta os pagamentos por período.
          </p>
        </div>
        <PaymentHistoryTable locale={locale} />
      </section>
    </div>
  );
}

function SectionError({ title, message }: { title: string; message: string }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">{title}</h2>
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-4">
        <p className="text-sm text-rose-700">{message}</p>
        <p className="text-xs text-rose-500 mt-1">
          Recarrega a página. Se o problema persistir, contacta o suporte.
        </p>
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
