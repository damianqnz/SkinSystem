import type { ReactNode } from 'react';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { pickMessages } from '@/i18n/pick-messages';
import { AUTH_CLIENT_NAMESPACES } from '@/i18n/client-namespaces';
import '../globals.css';

/**
 * Root layout for the auth portal (auth.skinsystem.pt).
 * Independent of the [tenant]/[locale] layout — no tenant context needed here.
 * Uses next/font/google for zero-CLS font loading (self-hosted by Next.js).
 */

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight:  ['400', '600', '700'],
  style:   ['normal', 'italic'],
  variable: '--font-serif',
  display:  'swap',
});

const outfit = Outfit({
  subsets:  ['latin'],
  weight:   ['300', '400', '500'],
  variable: '--font-sans',
  display:  'swap',
});

export default async function AuthLayout({ children }: { children: ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html
      lang={locale}
      className={`${cormorant.variable} ${outfit.variable}`}
    >
      <body className="min-h-screen bg-[#FAFAF9] text-stone-900 antialiased">
        <NextIntlClientProvider locale={locale} messages={pickMessages(messages, AUTH_CLIENT_NAMESPACES)}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
