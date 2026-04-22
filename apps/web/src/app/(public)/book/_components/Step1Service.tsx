'use client';

import { bookT, format, toIntlTag } from '../_i18n';
import type { SelectService } from '@/domains/catalog/schema';

// ── i18n helper for DB-driven i18n JSONB (service name / description) ──

function pickI18n(field: unknown, locale: string): string {
  if (!field || typeof field !== 'object') return '';
  const o = field as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

function fmtPrice(cents: number, locale: string, currency = 'EUR'): string {
  return (cents / 100).toLocaleString(toIntlTag(locale), {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  });
}

// ── Component ─────────────────────────────────────────────────

interface Step1ServiceProps {
  services:  SelectService[];
  locale:    string;
  onSelect:  (svc: SelectService) => void;
}

export function Step1Service({ services, locale, onSelect }: Step1ServiceProps) {
  const t = bookT(locale);

  if (services.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="font-cormorant text-2xl text-stone-400">
          {t.service.empty}
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-6 text-center">
        {t.service.heading}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {services.map((svc) => (
          <button
            key={svc.id}
            onClick={() => onSelect(svc)}
            className="group text-left bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden hover:border-amber-300 hover:shadow-md transition-all duration-200"
          >
            {/* Color strip */}
            <div
              className="h-1 w-full"
              style={{ backgroundColor: svc.color ?? '#D4AF37' }}
            />
            <div className="p-5">
              <h3 className="font-cormorant text-lg font-semibold text-stone-900 leading-tight">
                {pickI18n(svc.nameI18n, locale) || t.service.fallbackName}
              </h3>
              {pickI18n(svc.descriptionI18n, locale) && (
                <p className="text-xs text-stone-400 mt-1 line-clamp-2 leading-relaxed">
                  {pickI18n(svc.descriptionI18n, locale)}
                </p>
              )}
              <div className="mt-4 flex items-center justify-between">
                <span className="text-[11px] text-stone-400">
                  {svc.durationMinutes} {t.common.minutes}
                </span>
                <span className="font-outfit font-medium text-stone-800 tabular-nums text-sm">
                  {fmtPrice(svc.priceCents, locale, svc.currency)}
                </span>
              </div>
              {svc.depositPercent < 100 && (
                <p className="mt-1 text-[10px] text-amber-600">
                  {format(t.service.deposit, {
                    percent: svc.depositPercent,
                    amount:  fmtPrice(
                      Math.round(svc.priceCents * svc.depositPercent / 100),
                      locale,
                      svc.currency,
                    ),
                  })}
                </p>
              )}
              <div className="mt-3 text-[11px] font-medium text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                {t.service.select}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
