/**
 * @file (marketing)/layout.tsx
 * @description Root layout for the SaaS landing on the apex domain.
 *
 * No tenant, no auth, no brand tokens — this surface belongs to SkinSystem
 * itself, not to any specialist. It is a separate root layout precisely so the
 * tenant's brand styling can never leak into it.
 *
 * Every top-level route added here must also be added to `RESERVED_SUBDOMAINS`
 * in `infrastructure/tenant/host.ts`, or a tenant with that slug shadows it.
 */

import type { ReactNode } from 'react';
import { Outfit }         from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import '../globals.css';

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-sans',
  display: 'swap',
});

export default async function MarketingLayout({ children }: { children: ReactNode }) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);

  return (
    <html lang={locale} className={outfit.variable}>
      <body className="min-h-screen bg-stone-950 text-stone-100 antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
