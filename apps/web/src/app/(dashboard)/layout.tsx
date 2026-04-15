import { Suspense, type ReactNode } from 'react';
import { headers } from 'next/headers';
import { Toaster } from 'sonner';
import { TenantProvider } from '@/shared/providers/TenantProvider';
import { Sidebar } from '@/shared/components/dashboard/Sidebar';
import { BottomBar } from '@/shared/components/dashboard/BottomBar';
import { DashboardHeader } from '@/shared/components/dashboard/DashboardHeader';

/** PPR shell: Sidebar/Header are static; UserMenu + page content stream via Suspense. */
export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') ?? '';
  const locale     = headersList.get('x-locale') ?? 'es';

  // Capitalize slug for display: "lourdes" → "Lourdes"
  const tenantName = tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1);

  return (
    <TenantProvider tenantSlug={tenantSlug} locale={locale}>
      {/* Desktop sidebar */}
      <Sidebar tenantName={tenantName} />

      {/* Main column — offset by sidebar width on md+ */}
      <div className="flex flex-col min-h-screen md:pl-60">
        <DashboardHeader tenantName={tenantName} />

        <main className="flex-1 p-6 pb-20 md:pb-6 bg-[var(--color-spa-bg)]">
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

      {/* Global toast notifications (Sonner) */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "'Outfit', ui-sans-serif, sans-serif",
            fontSize:   '13px',
            borderRadius: '10px',
            border: '1px solid #E7E5E4',
          },
        }}
        richColors
      />
    </TenantProvider>
  );
}
