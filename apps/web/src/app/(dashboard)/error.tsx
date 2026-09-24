'use client';

/**
 * @file (dashboard)/error.tsx
 * @description Error boundary for the dashboard route group. Catches render
 *              errors in dashboard pages/children — the group layout still
 *              provides `<html>`/`<body>` + `globals.css`, so spa tokens and
 *              Tailwind utilities are available here. Uses an inline dictionary
 *              rather than `useTranslations`: the intl provider may be the thing
 *              that crashed. Locale is read from `<html lang>` on the client.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { RefreshCw, TriangleAlert } from 'lucide-react';
import { DEFAULT_LOCALE, type SupportedLocale } from '@/i18n/config';

const COPY: Record<SupportedLocale, { title: string; description: string; retry: string }> = {
  pt: {
    title: 'Algo não correu como esperado',
    description: 'Ocorreu um imprevisto ao carregar esta página. Aguarde um instante e tente novamente.',
    retry: 'Tentar novamente',
  },
  es: {
    title: 'Algo no ha salido como esperábamos',
    description: 'Se ha producido un imprevisto al cargar esta página. Espera un momento e inténtalo de nuevo.',
    retry: 'Intentar de nuevo',
  },
  en: {
    title: 'Something went wrong',
    description: 'An unexpected issue interrupted this page. Take a moment and try again.',
    retry: 'Try again',
  },
};

// useSyncExternalStore reads a browser-only value (the <html lang>) without a
// hydration mismatch and without setState-in-effect: the server snapshot is the
// default locale, the client snapshot the layout-resolved one.
const subscribe = () => () => {};

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const lang = useSyncExternalStore(
    subscribe,
    () => document.documentElement.lang,
    () => DEFAULT_LOCALE,
  );
  const locale: SupportedLocale =
    lang === 'pt' || lang === 'es' || lang === 'en' ? lang : DEFAULT_LOCALE;

  const t = COPY[locale];

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="flex max-w-md flex-col items-center gap-6 rounded-sm border border-spa-border bg-(--color-spa-bg) px-8 py-12 text-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        {/* Editorial icon — gold accent is decorative only */}
        <div className="relative">
          <div className="flex h-16 w-16 items-center justify-center rounded-sm border border-spa-border bg-white/60">
            <TriangleAlert size={22} strokeWidth={1.5} className="text-spa-muted" aria-hidden="true" />
          </div>
          <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-[#D4AF37]" aria-hidden="true" />
        </div>

        <div className="space-y-2">
          <h2 className="font-serif text-2xl font-light leading-snug text-(--color-spa-stone)">
            {t.title}
          </h2>
          <p className="font-sans text-sm leading-relaxed text-spa-muted">
            {t.description}
          </p>
        </div>

        <button
          type="button"
          onClick={() => reset()}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-sm border border-(--color-spa-stone) px-5 py-2.5 font-sans text-sm font-medium text-(--color-spa-stone) shimmer-btn transition-colors duration-200 hover:bg-(--color-spa-stone) hover:text-(--color-spa-bg)"
        >
          <RefreshCw size={14} strokeWidth={1.5} aria-hidden="true" />
          {t.retry}
        </button>
      </div>
    </div>
  );
}
