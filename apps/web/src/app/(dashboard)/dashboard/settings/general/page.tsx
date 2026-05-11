import { headers }        from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE }  from '@/i18n/config';
import { DashboardLanguageSelector } from './_components/DashboardLanguageSelector';

type Locale = 'pt' | 'es' | 'en';

function isLocale(value: string | null): value is Locale {
  return value === 'pt' || value === 'es' || value === 'en';
}

export default async function GeneralSettingsPage() {
  const hdrs = await headers();
  const raw  = hdrs.get('x-locale');
  const locale: Locale = isLocale(raw) ? raw : DEFAULT_LOCALE;
  const t = await getTranslations({ locale, namespace: 'dashboard.settings.general' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('title')}</h1>
        <p className="text-sm text-stone-400 mt-1">{t('description')}</p>
      </div>

      <section id="general" className="space-y-5">
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8">
          <DashboardLanguageSelector current={locale} />
        </div>
      </section>
    </div>
  );
}
