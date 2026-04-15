import type { ReactNode } from 'react';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
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

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${cormorant.variable} ${outfit.variable}`}
    >
      <body className="min-h-screen bg-[#FAFAF9] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
