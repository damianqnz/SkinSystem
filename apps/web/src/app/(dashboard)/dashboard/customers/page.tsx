import { headers }         from 'next/headers';
import { getTranslations }  from 'next-intl/server';

export default async function CustomersPage() {
  const hdrs   = await headers();
  const locale = hdrs.get('x-locale') ?? 'pt';
  const t      = await getTranslations({ locale, namespace: 'dashboard.customers.page' });

  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-8 text-center">
      <div className="space-y-3 max-w-xs">
        <div className="w-2 h-2 rounded-full bg-[#D4AF37] mx-auto" />
        <h2 className="font-serif text-2xl font-light text-stone-700">{t('emptyHeading')}</h2>
        <p className="font-sans text-sm text-stone-400 leading-relaxed">{t('emptyBody')}</p>
      </div>
    </div>
  );
}
