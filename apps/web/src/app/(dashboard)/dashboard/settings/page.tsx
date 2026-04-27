import { headers }                  from 'next/headers';
import { notFound }                 from 'next/navigation';
import { getOrganizationBySlug }    from '@/domains/organizations/service';
import { getOrganizationSettings }  from '@/domains/organizations/service';
import { StripeConnectCard }        from './_components/StripeConnectCard';
import {
  settingsTranslations,
  pickSettingsLocale,
} from '@/shared/lib/i18n/settings';

interface SettingsPageProps {
  searchParams: Promise<{ stripe?: string }>;
}

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = pickSettingsLocale(hdrs.get('x-locale'));
  const t      = settingsTranslations[locale];

  const { stripe: stripeParam } = await searchParams;

  // Resolve org
  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) notFound();

  const settingsResult = await getOrganizationSettings(orgResult.data.id);
  const settings = settingsResult.data;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t.page.title}</h1>
        <p className="text-sm text-stone-400 mt-1">{t.page.subtitle}</p>
      </div>

      {/* Stripe Connect Card */}
      <section>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3 px-1">
          {t.page.sectionPayments}
        </h2>
        <StripeConnectCard
          stripeAccountId={settings?.stripeAccountId ?? null}
          stripeOnboarded={settings?.stripeOnboarded ?? false}
          locale={locale}
          stripeParam={stripeParam ?? null}
        />
      </section>

      {/* Placeholder sections */}
      <section>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3 px-1">
          {t.page.sectionBusiness}
        </h2>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm text-stone-400 italic">{t.page.placeholderBusiness}</p>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-3 px-1">
          {t.page.sectionNotifications}
        </h2>
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
          <p className="text-sm text-stone-400 italic">{t.page.placeholderNotifications}</p>
        </div>
      </section>
    </div>
  );
}
