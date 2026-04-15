import type { ReactNode } from 'react';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import '../globals.css';

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

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <html className={`${cormorant.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-[#FAFAF9] text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
