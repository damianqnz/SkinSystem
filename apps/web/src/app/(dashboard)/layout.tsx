import { Suspense, type ReactNode } from 'react';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { Cormorant_Garamond, Outfit } from 'next/font/google';
import { Toaster } from 'sonner';
import { TenantProvider } from '@/shared/providers/TenantProvider';
import { SidebarProvider } from '@/shared/components/dashboard/SidebarContext';
import { Sidebar } from '@/shared/components/dashboard/Sidebar';
import { MainOffset } from '@/shared/components/dashboard/MainOffset';
import { BottomBar } from '@/shared/components/dashboard/BottomBar';
import { DashboardHeader } from '@/shared/components/dashboard/DashboardHeader';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
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

  // ── RBAC gate ─────────────────────────────────────────────────
  // Any user reaching this layout was already authenticated by the proxy.
  // Here we enforce that they are ALSO staff of this tenant
  // (profiles row with matching organization_id + is_active).
  // Customers (authenticated via /me, stored in `public.customers`,
  // no `profiles` row) are bounced to their own dashboard.
  const auth = await resolveTenantOrgId();
  if ('error' in auth) {
    switch (auth.code) {
      case 'NO_AUTH':
        // Proxy should catch this first; redundant defense in depth.
        redirect('/login');
      case 'NOT_MEMBER':
        // Authenticated but not staff here → they're a customer (or staff
        // of another tenant). Send them to their own space.
        redirect('/me');
      case 'INACTIVE':
      case 'FORBIDDEN':
      case 'NO_TENANT':
      case 'ORG_NOT_FOUND':
      default:
        // Any other anomaly → send home. Avoids rendering the admin shell
        // for a user we can't positively identify as staff.
        redirect('/me');
    }
  }

  // Capitalize slug for display: "lourdes" → "Lourdes"
  const tenantName = tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1);

  return (
    <TenantProvider
      tenantSlug={tenantSlug}
      locale={locale}
      userId={auth.userId}
      role={auth.role}
    >
      <SidebarProvider>
        {/* Desktop sidebar (fixed-positioned, out of flow) */}
        <Sidebar tenantName={tenantName} />

        {/* Main column — offset adjusts when sidebar collapses */}
        <MainOffset>
          <DashboardHeader />

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
        </MainOffset>
      </SidebarProvider>

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
