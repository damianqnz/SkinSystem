import { Suspense, type ReactNode } from 'react';
import { headers } from 'next/headers';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import { TenantProvider } from '@/shared/providers/TenantProvider';
import { Sidebar } from '@/shared/components/dashboard/Sidebar';
import { BottomBar } from '@/shared/components/dashboard/BottomBar';
import { DashboardHeader } from '@/shared/components/dashboard/DashboardHeader';
import '../globals.css';

// ── Fonts (self-hosted by Next.js, zero CLS) ──────────────────────────────
const cormorant = Cormorant_Garamond({
  subsets:  ['latin'],
  weight:   ['400', '600', '700'],
  style:    ['normal', 'italic'],
  variable: '--font-serif',
  display:  'swap',
});

const outfit = Outfit({
  subsets:  ['latin'],
  weight:   ['300', '400', '500'],
  variable: '--font-sans',
  display:  'swap',
});

// ── Dynamic shell ─────────────────────────────────────────────────────────
// Reads request headers (set by middleware). MUST live inside <Suspense>
// because Next 16 `cacheComponents` rejects runtime data accessed in the
// statically-cacheable outer layout.
async function DashboardShell({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const tenantSlug  = headersList.get('x-tenant-slug') ?? '';
  const locale      = headersList.get('x-locale') ?? 'es';

  // Capitalize slug for display: "lourdes" → "Lourdes"
  const tenantName = tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1);

  return (
    <TenantProvider tenantSlug={tenantSlug} locale={locale}>
      {/* Desktop sidebar (fixed-positioned, out of flow) */}
      <Sidebar tenantName={tenantName} />

      {/* Main column — offset by sidebar width on md+ */}
      <div className="flex flex-col min-h-screen md:pl-60">
        <DashboardHeader tenantName={tenantName} />

        <main className="flex-1 p-6 pb-20 md:pb-6 bg-(--color-spa-bg)">
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-40">
                <span className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
              </div>
            }
          >
            {children}
          </Suspense>
        </main>
      </div>

      {/* Mobile bottom navigation (Thumb Zone) */}
      <BottomBar />
    </TenantProvider>
  );
}

// ── Root layout ───────────────────────────────────────────────────────────
// Provides the <html>/<body> root for the dashboard route group, matching
// the convention used by (auth)/layout.tsx and (public)/layout.tsx.
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" className={`${cormorant.variable} ${outfit.variable}`}>
      <body className="min-h-screen bg-(--color-spa-bg) text-stone-900 antialiased">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-(--color-spa-bg)">
              <span className="w-6 h-6 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
            </div>
          }
        >
          <DashboardShell>{children}</DashboardShell>
        </Suspense>

        {/* Global toasts — outside Suspense so always mounted */}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              fontFamily:   "'Outfit', ui-sans-serif, sans-serif",
              fontSize:     '13px',
              borderRadius: '10px',
              border:       '1px solid #E7E5E4',
            },
          }}
          richColors
        />
      </body>
    </html>
  );
}
