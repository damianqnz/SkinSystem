import { headers }          from 'next/headers';
import { getTranslations }  from 'next-intl/server';
import { localeFromHeader } from '@/i18n/detect-locale';
import { Sparkles } from 'lucide-react';

export default async function RecomendacionesPage() {
  const hdrs   = await headers();
  const locale = localeFromHeader(hdrs.get('x-locale'));
  const t      = await getTranslations({ locale, namespace: 'account.me.recomendaciones' });

  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-cormorant text-xl font-semibold text-stone-900">{t('title')}</h2>
        <p className="text-xs text-stone-400 mt-0.5 font-outfit">
          {t('description')}
        </p>
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-16 gap-4">
        <div className="w-14 h-14 rounded-full bg-stone-50 border border-stone-100 flex items-center justify-center">
          <Sparkles size={22} className="text-stone-300" />
        </div>
        <div className="text-center max-w-xs">
          <p className="font-outfit text-sm font-medium text-stone-600">
            {t('emptyTitle')}
          </p>
          <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
            {t('emptyDescription')}
          </p>
        </div>
      </div>
    </div>
  );
}
