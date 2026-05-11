import { headers }        from 'next/headers';
import { getTranslations } from 'next-intl/server';
import { DEFAULT_LOCALE }  from '@/i18n/config';

export default async function ProfileSettingsPage() {
  const hdrs   = await headers();
  const locale = hdrs.get('x-locale') ?? DEFAULT_LOCALE;
  const t      = await getTranslations({ locale, namespace: 'dashboard.settings.profile' });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('title')}</h1>
        <p className="text-sm text-stone-400 mt-1">{t('description')}</p>
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-8 text-center">
        <p className="text-sm text-stone-400">{t('comingSoon')}</p>
      </div>
    </div>
  );
}
