import { headers }               from 'next/headers';
import { notFound }              from 'next/navigation';
import { and, eq }               from 'drizzle-orm';
import type { Metadata }         from 'next';
import { db }                    from '@/infrastructure/db';
import { getOrganizationBySlug } from '@/domains/organizations/service';
import { getActiveServices }     from '@/domains/catalog/service';
import { organizations }         from '@/infrastructure/db/schema/organizations';
import { bookingSettings, paymentSurcharges } from '@/infrastructure/db/schema/booking';
import { googleReviews }         from '@/infrastructure/db/schema/notifications';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getLandingData }        from '../_data/getLandingData';
import { ServicesAccordion }     from '../_components/ServicesAccordion';
import { StickyInfoCard }        from '../_components/StickyInfoCard';
import { BookingFunnel }         from './_components/BookingFunnel';
import { BookHeader }            from './_components/BookHeader';
import { StepIndicator }         from './_components/StepIndicator';
import { bookT, format }         from './_i18n';
import type { BookingConfig, SurchargeItem } from './actions';

// ── Shared helper: resolve current Supabase auth user (if any) ─

async function getAuthUser(): Promise<{ name: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const name = (user.user_metadata?.full_name as string | undefined)
    ?? (user.user_metadata?.name as string | undefined)
    ?? user.email.split('@')[0]
    ?? 'Usuario';

  return { name, email: user.email };
}

// ── SEO ───────────────────────────────────────────────────────

export async function generateMetadata(): Promise<Metadata> {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'pt';
  const org    = await getOrganizationBySlug(slug);
  const name   = org.data?.name ?? 'SkinSystem';
  return {
    title: format(bookT(locale).metadata.title, { name }),
  };
}

// ── Page ──────────────────────────────────────────────────────

interface BookPageProps {
  searchParams: Promise<{ service?: string; cancelled?: string; auth_error?: string }>;
}

export default async function BookPage({ searchParams }: BookPageProps) {
  const hdrs    = await headers();
  const slug    = hdrs.get('x-tenant-slug') ?? '';
  const locale  = hdrs.get('x-locale') ?? 'pt';
  const labels  = bookT(locale);
  const typedLocale = locale === 'pt' || locale === 'en' ? locale : 'es';
  const { service: serviceParam, cancelled, auth_error } = await searchParams;

  // ── Mode B: catalog view — no service pre-selected ────────────
  if (!serviceParam) {
    const data = await getLandingData(slug);
    if (!data) notFound();

    const { org, phones, availability, openStatus, avgRating, reviewCount, categories } = data;
    const cardProps = { org, phones, availability, openStatus, avgRating, reviewCount };

    // Resolve auth user + clientLoginEnabled flag in parallel so
    // the StepIndicator reflects the same step count the funnel
    // will later use (3 or 4 dots — never a mid-flow surprise).
    const [authUserB, loginRows] = await Promise.all([
      getAuthUser(),
      db.select({ clientLoginEnabled: bookingSettings.clientLoginEnabled })
        .from(bookingSettings)
        .where(eq(bookingSettings.organizationId, org.id))
        .limit(1),
    ]);

    const clientLoginEnabled = loginRows[0]?.clientLoginEnabled ?? false;
    const showAuthStep = clientLoginEnabled && !authUserB;

    return (
      <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100">

        <BookHeader
          orgName={org.name}
          logoUrl={org.logoUrl}
          locale={typedLocale}
          labels={labels}
        />

        <div className="max-w-6xl mx-auto px-4">

          {/* Step indicator — catalog is step 1 */}
          <div className="max-w-xl mx-auto pt-8">
            <StepIndicator current="service" showAuthStep={showAuthStep} locale={locale} />
          </div>

          {/* Mobile: info card on top */}
          <div className="lg:hidden pb-4">
            <StickyInfoCard {...cardProps} showReserveButton={false} />
          </div>

          {/* Two-column grid */}
          <div className="lg:grid lg:grid-cols-[1fr_310px] lg:gap-10 lg:items-start">

            {/* Left: services accordion */}
            <main>
              <ServicesAccordion categories={categories} locale={locale} />
              <div className="h-16" />
            </main>

            {/* Right: sticky info card (desktop only) */}
            <aside className="hidden lg:block">
              <div className="sticky top-20 py-8">
                <StickyInfoCard {...cardProps} showReserveButton={false} />
              </div>
            </aside>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-stone-100 dark:border-stone-800 py-8 px-4">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="font-cormorant text-stone-400 text-lg">{org.name}</p>
            <p className="text-[11px] text-stone-400 font-outfit">
              © {new Date().getFullYear()} · Powered by SkinSystem
            </p>
          </div>
        </footer>
      </div>
    );
  }

  // ── Mode A: funnel — service pre-selected ─────────────────────

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();
  const org = orgResult.data;

  const [
    svcResult,
    orgExtRows,
    settingsRows,
    surchargeRows,
    reviewRows,
    authUser,
  ] = await Promise.all([
    getActiveServices(org.id),

    db.select({
      logoUrl: organizations.logoUrl,
      address: organizations.address,
      city:    organizations.city,
    })
      .from(organizations)
      .where(eq(organizations.id, org.id))
      .limit(1),

    db.select({
      onlinePaymentEnabled:   bookingSettings.onlinePaymentEnabled,
      advancePaymentRequired: bookingSettings.advancePaymentRequired,
      clientLoginEnabled:     bookingSettings.clientLoginEnabled,
      clientLoginRequired:    bookingSettings.clientLoginRequired,
      formFieldName:          bookingSettings.formFieldName,
      formFieldPhone:         bookingSettings.formFieldPhone,
      formFieldEmail:         bookingSettings.formFieldEmail,
      formFieldAddress:       bookingSettings.formFieldAddress,
      bookingWindowDays:      bookingSettings.bookingWindowDays,
      bookingLeadTimeHours:   bookingSettings.bookingLeadTimeHours,
      weekStartDay:           bookingSettings.weekStartDay,
      timeFormat:             bookingSettings.timeFormat,
      showServicePrices:      bookingSettings.showServicePrices,
      showServiceDuration:    bookingSettings.showServiceDuration,
      cancellationPolicyText: bookingSettings.cancellationPolicyText,
      termsRequired:          bookingSettings.termsRequired,
      termsLabel:             bookingSettings.termsLabel,
      termsUrl:               bookingSettings.termsUrl,
    })
      .from(bookingSettings)
      .where(eq(bookingSettings.organizationId, org.id))
      .limit(1),

    db.select({
      id:          paymentSurcharges.id,
      name:        paymentSurcharges.name,
      valueType:   paymentSurcharges.valueType,
      value:       paymentSurcharges.value,
      isReduction: paymentSurcharges.isReduction,
    })
      .from(paymentSurcharges)
      .where(and(
        eq(paymentSurcharges.organizationId, org.id),
        eq(paymentSurcharges.isActive, true),
      )),

    db.select({ rating: googleReviews.rating })
      .from(googleReviews)
      .where(eq(googleReviews.organizationId, org.id)),

    // Current Supabase session (if any) — drives auth-step skipping.
    getAuthUser(),
  ]);

  const services = svcResult.data ?? [];
  const orgExt   = orgExtRows[0];

  const raw = settingsRows[0];
  const config: BookingConfig = raw ?? {
    onlinePaymentEnabled:    false,
    advancePaymentRequired:  false,
    clientLoginEnabled:      false,
    clientLoginRequired:     false,
    formFieldName:           true,
    formFieldPhone:          true,
    formFieldEmail:          true,
    formFieldAddress:        false,
    bookingWindowDays:       60,
    bookingLeadTimeHours:    4,
    weekStartDay:            1,
    timeFormat:              '24h',
    showServicePrices:       true,
    showServiceDuration:     true,
    cancellationPolicyText:  null,
    termsRequired:           false,
    termsLabel:              null,
    termsUrl:                null,
  };

  const surcharges: SurchargeItem[] = surchargeRows.map((s) => ({
    id:          s.id,
    name:        s.name,
    valueType:   s.valueType as 'percent' | 'fixed',
    value:       parseFloat(String(s.value)),
    isReduction: s.isReduction,
  }));

  const totalRating = reviewRows.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0);
  const reviewCount = reviewRows.length;
  const avgRating   = reviewCount > 0 ? Math.round((totalRating / reviewCount) * 10) / 10 : 0;

  const orgData = {
    name:        org.name,
    logoUrl:     orgExt?.logoUrl ?? null,
    address:     orgExt?.address ?? null,
    city:        orgExt?.city ?? null,
    avgRating,
    reviewCount,
  };

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      <BookHeader orgName={org.name} logoUrl={orgExt?.logoUrl ?? null} locale={typedLocale} labels={labels} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {cancelled === '1' && (
          <div className="mb-6 flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
            <span className="text-sm text-amber-700">{labels.notices.cancelledPayment}</span>
          </div>
        )}
        {auth_error === '1' && (
          <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            <span className="text-sm text-red-700">{labels.notices.oauthError}</span>
          </div>
        )}

        <BookingFunnel
          services={services}
          locale={locale}
          initialService={serviceParam}
          config={config}
          surcharges={surcharges}
          orgData={orgData}
          authUser={authUser}
        />
      </main>
    </div>
  );
}
