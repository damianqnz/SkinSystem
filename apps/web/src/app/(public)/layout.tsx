import type { ReactNode } from 'react';
import { headers }         from 'next/headers';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { Toaster }         from 'sonner';
import { eq }              from 'drizzle-orm';
import { db }              from '@/infrastructure/db';
import { organizations }   from '@/infrastructure/db/schema/organizations';
import '../globals.css';

// ── Fonts ─────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────
const BTN_RADIUS: Record<string, string> = {
  pill:      '9999px',
  rounded:   '12px',
  rectangle: '4px',
};

// ── Layout ────────────────────────────────────────────────────
export default async function PublicLayout({ children }: { children: ReactNode }) {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';

  // Fetch brand appearance config
  let brandColor = '#D4AF37';
  let btnRadius  = '12px';
  let theme: 'system' | 'light' | 'dark' = 'system';

  if (slug) {
    const rows = await db
      .select({ themeConfig: organizations.themeConfig })
      .from(organizations)
      .where(eq(organizations.slug, slug))
      .limit(1);

    const cfg = (rows[0]?.themeConfig ?? {}) as Record<string, string>;
    if (cfg.brandColor)  brandColor = cfg.brandColor;
    if (cfg.buttonShape) btnRadius  = BTN_RADIUS[cfg.buttonShape] ?? '12px';
    if (cfg.theme && ['system', 'light', 'dark'].includes(cfg.theme)) {
      theme = cfg.theme as 'system' | 'light' | 'dark';
    }
  }

  // For system mode: inject an inline script that adds .dark class at runtime
  // before first paint — this avoids the light → dark flash (FOUC).
  const systemThemeScript =
    theme === 'system'
      ? `try{if(window.matchMedia('(prefers-color-scheme:dark)').matches)document.documentElement.classList.add('dark');}catch(e){}`
      : null;

  // Server-set dark class (forced dark mode — no script needed)
  const htmlClass = [
    cormorant.variable,
    outfit.variable,
    theme === 'dark' ? 'dark' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <html className={htmlClass} suppressHydrationWarning>
      <head>
        {/* Brand appearance tokens — injected before any render */}
        <style dangerouslySetInnerHTML={{
          __html: `:root{--brand-color:${brandColor};--btn-radius:${btnRadius};}`,
        }} />
        {/* System dark mode: detect OS preference and toggle .dark class */}
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
