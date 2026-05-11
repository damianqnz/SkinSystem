'use client';

import { Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';

/**
 * EmptyState — editorial no-appointments state.
 * Shows when getUpcomingAppointments returns an empty array.
 */
export function EmptyState() {
  const t = useTranslations('dashboard.home.empty');

  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      {/* Editorial icon container */}
      <div className="relative">
        <div className="w-16 h-16 rounded-sm border border-spa-border bg-white/60 backdrop-blur-md flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Calendar size={22} strokeWidth={1.5} className="text-spa-muted" />
        </div>
        {/* Gold accent dot */}
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
      </div>

      {/* Copy */}
      <div className="space-y-2 max-w-xs">
        <h3 className="font-serif text-xl font-light text-(--color-spa-stone) leading-snug">
          {t('heading')}
        </h3>
        <p className="font-sans text-sm text-spa-muted leading-relaxed">
          {t('body')}
        </p>
      </div>

      {/* CTA */}
      <a
        href="/settings/calendar"
        className="inline-flex items-center gap-2 px-5 py-2.5 shimmer-btn font-sans text-sm font-medium text-(--color-spa-stone) border border-(--color-spa-stone) rounded-sm hover:bg-(--color-spa-stone) hover:text-(--color-spa-bg) transition-colors duration-200"
      >
        <Calendar size={14} strokeWidth={1.5} />
        {t('cta')}
      </a>
    </div>
  );
}
