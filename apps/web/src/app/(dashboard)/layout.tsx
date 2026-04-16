import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import { TenantProvider }    from '@/shared/providers/TenantProvider';
import { Sidebar }           from '@/shared/components/dashboard/Sidebar';
import { BottomBar }         from '@/shared/components/dashboard/BottomBar';
import { DashboardHeader }   from '@/shared/components/dashboard/DashboardHeader';
import '../globals.css';

// ── Fonts (self-hosted by Next.js, zero layout shift) ─────────────────────
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
// Reads request headers (set by middleware) — must live inside <Suspense>
// so PPR can statically cache the outer html/body while streaming this part.
async function DashboardShell({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const tenantSlug  = headersList.get('x-tenant-slug') ?? 'lourdes';
  const locale      = headersList.get('x-locale') ?? 'pt';

  // Capitalise each word so "lourdes estetica" → "Lourdes Estetica"
  const tenantName = tenantSlug
    .split(/[-_ ]+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  return (
    <TenantProvider tenantSlug={tenantSlug} locale={locale}>
      {/* ── Fixed Desktop sidebar ────────────────────────────── */}
      <Sidebar tenantName={tenantName} />

      {/* ── Main column — pushed right by sidebar width on md+ ─ */}
      <div className="flex flex-col min-h-screen md:pl-64">
        <DashboardHeader tenantName={tenantName} />

        <main className="flex-1 p-6 pb-20 md:pb-6 bg-[#FAFAF9]">
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

      {/* ── Mobile bottom navigation ─────────────────────────── */}
      <BottomBar />
    </TenantProvider>
  );
}

// ── Root layout for the dashboard shell ───────────────────────────────────
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="pt"
      className={`${cormorant.variable} ${outfit.variable}`}
    >
      <body className="bg-[#F5F3EF] text-[#1C1917] antialiased">
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center bg-[#FAFAF9]">
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
