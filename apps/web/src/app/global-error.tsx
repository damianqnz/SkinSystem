'use client';

/**
 * @file global-error.tsx
 * @description Catastrophic root boundary — replaces a crashed root layout, so it
 *              must render its own `<html>`/`<body>`. Kept deliberately
 *              dependency-light: no next-intl provider (it may be the thing that
 *              crashed), no Tailwind/`globals.css` reliance — inline styles carry
 *              the spa tokens so it renders correctly even if the styling pipeline
 *              is gone. Copy lives in a tiny inline dictionary keyed by locale.
 */

import { useEffect, useSyncExternalStore } from 'react';
import { DEFAULT_LOCALE, type SupportedLocale } from '@/i18n/config';

const COPY: Record<SupportedLocale, { title: string; description: string; retry: string }> = {
  pt: {
    title: 'Serviço momentaneamente indisponível',
    description: 'Deparámo-nos com um contratempo inesperado. Atualize a página para retomar.',
    retry: 'Recarregar página',
  },
  es: {
    title: 'Servicio temporalmente no disponible',
    description: 'Hemos encontrado un inconveniente inesperado. Actualiza la página para continuar.',
    retry: 'Recargar página',
  },
  en: {
    title: 'Service temporarily unavailable',
    description: 'We ran into an unexpected problem. Refresh the page to continue.',
    retry: 'Reload page',
  },
};

// useSyncExternalStore reads a browser-only value (the visitor's language)
// without a hydration mismatch and without setState-in-effect: the server
// snapshot is the default locale, the client snapshot the real one.
const subscribe = () => () => {};

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  // Progressive enhancement: upgrade from the default locale to the browser's.
  const lang = useSyncExternalStore(
    subscribe,
    () => navigator.language.toLowerCase().split('-')[0],
    () => DEFAULT_LOCALE,
  );
  const locale: SupportedLocale =
    lang === 'pt' || lang === 'es' || lang === 'en' ? lang : DEFAULT_LOCALE;

  const t = COPY[locale];

  return (
    <html lang={locale}>
      <body style={{ margin: 0, backgroundColor: '#FAFAF9', color: '#1C1917' }}>
        <main
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1.5rem',
            padding: '5rem 1.5rem',
            textAlign: 'center',
            fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
          }}
        >
          {/* Editorial icon — gold accent is decorative only */}
          <div style={{ position: 'relative' }}>
            <div
              style={{
                width: 64,
                height: 64,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 2,
                border: '1px solid #E7E5E4',
                backgroundColor: 'rgba(255,255,255,0.6)',
              }}
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#78716C"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
            </div>
            <span
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 10,
                height: 10,
                borderRadius: '9999px',
                backgroundColor: '#D4AF37',
              }}
            />
          </div>

          <div style={{ maxWidth: '28rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: "'Cormorant Garamond', Georgia, ui-serif, serif",
                fontSize: '1.875rem',
                fontWeight: 300,
                lineHeight: 1.3,
                color: '#1C1917',
              }}
            >
              {t.title}
            </h1>
            <p style={{ margin: 0, fontSize: '0.875rem', lineHeight: 1.6, color: '#78716C' }}>
              {t.description}
            </p>
          </div>

          <button
            type="button"
            onClick={() => reset()}
            style={{
              minHeight: 44,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.625rem 1.25rem',
              borderRadius: 2,
              border: '1px solid #1C1917',
              backgroundColor: 'transparent',
              color: '#1C1917',
              fontFamily: 'inherit',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {t.retry}
          </button>
        </main>
      </body>
    </html>
  );
}
