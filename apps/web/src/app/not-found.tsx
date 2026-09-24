/**
 * @file not-found.tsx
 * @description Root 404 boundary. There is no `app/layout.tsx` — each route group
 *              owns its own `<html>`/`<body>`, and the tenant layout calls
 *              `notFound()` *before* rendering its shell. So this file must be a
 *              self-contained document: its own `<html>`/`<body>` + `globals.css`.
 *              Locale comes from the `x-locale` header the proxy already resolved;
 *              copy from the shared `errors` namespace via server `getTranslations`.
 */

import Link from 'next/link';
import { headers } from 'next/headers';
import { Compass, Home } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { localeFromHeader } from '@/i18n/detect-locale';
import './globals.css';

export default async function NotFound() {
  const hdrs = await headers();
  const locale = localeFromHeader(hdrs.get('x-locale'));
  const t = await getTranslations('errors');

  return (
    <html lang={locale}>
      <body className="bg-(--color-spa-bg) antialiased">
        <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 py-20 text-center">
          {/* Editorial icon — gold accent is decorative only (fails AA as text) */}
          <div className="relative">
            <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-spa-border bg-white/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] backdrop-blur-md">
              <Compass size={22} strokeWidth={1.5} className="text-spa-muted" aria-hidden="true" />
            </div>
            <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
          </div>

          <div className="max-w-md space-y-2">
            <h1 className="font-serif text-3xl font-light leading-snug text-(--color-spa-stone)">
              {t('notFound.title')}
            </h1>
            <p className="font-sans text-sm leading-relaxed text-spa-muted">
              {t('notFound.description')}
            </p>
          </div>

          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-sm border border-(--color-spa-stone) px-5 py-2.5 font-sans text-sm font-medium text-(--color-spa-stone) shimmer-btn transition-colors duration-200 hover:bg-(--color-spa-stone) hover:text-(--color-spa-bg)"
          >
            <Home size={14} strokeWidth={1.5} aria-hidden="true" />
            {t('notFound.cta')}
          </Link>
        </main>
      </body>
    </html>
  );
}
