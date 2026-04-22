'use client';

/**
 * @file BookHeader.tsx
 * @description Sticky top bar for the `/book` consumer funnel.
 *
 *  - Logo / brand name (links back to the tenant's landing).
 *  - `LanguageSwitcher` — the same component used on the landing navbar,
 *    so the user can flip ES ↔ PT ↔ EN at any step (including "Acceso").
 *  - Intentionally DOES NOT reuse `PublicHeader`: that component wires
 *    scroll-to-section navigation for the landing (#servicos, #sobre, …),
 *    which don't exist inside the booking funnel.
 *
 * Tailwind-only styling (90/10 boundary rule).
 */

import Link                   from 'next/link';
import { LanguageSwitcher }   from '../../_components/LanguageSwitcher';
import type { BookingLabels } from '../_i18n';

type Locale = 'es' | 'pt' | 'en';

interface Props {
  orgName:  string;
  logoUrl?: string | null;
  locale:   Locale;
  labels:   BookingLabels;
}

export function BookHeader({ orgName, logoUrl, locale, labels }: Props) {
  return (
    <header className="sticky top-0 z-10 bg-[#FAFAF9]/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-100 dark:border-stone-800">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4 px-6 h-14">
        {/* Brand — returns to tenant landing */}
        <Link
          href="/"
          className="hover:opacity-80 transition-opacity flex-shrink-0"
          aria-label={labels.header.back}
        >
          {logoUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={logoUrl}
              alt={orgName}
              className="h-8 w-auto object-contain max-w-[160px]"
            />
          ) : (
            <span className="font-cormorant text-xl font-semibold text-stone-900 dark:text-stone-100 truncate">
              {orgName}
            </span>
          )}
        </Link>

        {/* Right cluster: book context + language */}
        <div className="flex items-center gap-3 shrink-0">
          <span className="hidden sm:inline text-xs text-stone-400 font-outfit">
            {labels.header.title}
          </span>
          <LanguageSwitcher current={locale} scrolled />
        </div>
      </div>
    </header>
  );
}
