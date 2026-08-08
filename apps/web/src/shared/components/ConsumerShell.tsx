/**
 * @file shared/components/ConsumerShell.tsx
 * @description The `<html>`/`<body>` document shell for the consumer-facing
 *              route groups — `(tenant)` and `(account)`.
 *
 * Both groups are root layouts on the same subdomain and must produce an
 * identical document: same fonts, same brand tokens, same toaster. Keeping the
 * shell here is what lets the two groups stay independent without drifting.
 *
 * The inline `<style>` below interpolates brand tokens. They are safe to inject
 * because `getBrandTheme()` never returns raw tenant input: `brandColor` must
 * match a hex pattern and `btnRadius` comes from a fixed lookup table.
 *
 * No `NextIntlClientProvider` here, on purpose. Nothing under `(tenant)` or
 * `(account)` calls `useTranslations` — those trees still read the local
 * `book/_i18n` maps, which PR3 migrates to `messages/*.json`. Mounting the
 * provider before there is a consumer would ship the whole message bundle to
 * the client on every consumer page for nothing. It goes in with PR3.
 */

import type { ReactNode } from 'react';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { Toaster }        from 'sonner';
import type { BrandTheme } from '@/shared/lib/brand-theme';
import type { SupportedLocale } from '@/i18n/config';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

interface Props {
  theme:    BrandTheme;
  /** Resolved by the proxy into `x-locale`. Drives `<html lang>` (WCAG 3.1.1). */
  locale:   SupportedLocale;
  children: ReactNode;
}

export function ConsumerShell({ theme, locale, children }: Props) {
  // For system mode: inject an inline script that adds .dark class at runtime
  // before first paint — this avoids the light → dark flash (FOUC).
  const systemThemeScript =
    theme.scheme === 'system'
      ? `try{if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark');}catch(e){}`
      : null;

  // Server-set dark class (forced dark mode — no script needed)
  const htmlClass = [
    cormorant.variable,
    outfit.variable,
    theme.scheme === 'dark' ? 'dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html lang={locale} className={htmlClass} suppressHydrationWarning>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `:root{--brand-color:${theme.brandColor};--btn-radius:${theme.btnRadius};}`,
        }} />
        {systemThemeScript && (
          <script dangerouslySetInnerHTML={{ __html: systemThemeScript }} />
        )}
      </head>
      <body className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 antialiased">
        {children}
        <Toaster
          position="bottom-center"
          richColors
          toastOptions={{
            style: {
              fontFamily: "'Outfit', ui-sans-serif, system-ui, sans-serif",
              borderRadius: '12px',
              border: '1px solid #E7E5E4',
            },
          }}
        />
      </body>
    </html>
  );
}
