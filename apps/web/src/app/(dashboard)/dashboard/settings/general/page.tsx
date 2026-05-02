import { headers } from 'next/headers';
import { DashboardLanguageSelector } from './_components/DashboardLanguageSelector';

import esMsgs from '@/messages/es.json';
import ptMsgs from '@/messages/pt.json';
import enMsgs from '@/messages/en.json';

type Locale = 'pt' | 'es' | 'en';

const MESSAGES = {
  es: esMsgs,
  pt: ptMsgs,
  en: enMsgs,
} as const satisfies Record<Locale, unknown>;

function isLocale(value: string | null): value is Locale {
  return value === 'pt' || value === 'es' || value === 'en';
}

export default async function GeneralSettingsPage() {
  const hdrs   = await headers();
  const raw    = hdrs.get('x-locale');
  const locale: Locale = isLocale(raw) ? raw : 'pt';
  const t      = MESSAGES[locale].settings.general;

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">
          {t.title}
        </h1>
        <p className="text-sm text-stone-400 mt-1">{t.description}</p>
      </div>

      <section id="general" className="space-y-5">
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          {t.sectionLabel}
        </h2>

        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 sm:p-8">
          <DashboardLanguageSelector
            current={locale}
            labels={{
              languageLabel:  t.languageLabel,
              languageHelper: t.languageHelper,
              optionPt:       t.optionPt,
              optionEs:       t.optionEs,
              optionEn:       t.optionEn,
              toastSuccess:   t.toastSuccess,
              toastError:     t.toastError,
            }}
          />
        </div>
      </section>
    </div>
  );
}
