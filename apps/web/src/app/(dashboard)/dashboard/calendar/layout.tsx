import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { CalendarsSidebar } from './_components/CalendarsSidebar';

/**
 * Agenda layout — adds a secondary collapsible sidebar to the right of the
 * primary nav. The header's tenantName is used as the local-calendar label.
 *
 * `headers()` is wrapped inside <Suspense> to satisfy Next 16 cacheComponents.
 */
async function AgendaShell({ children }: { children: ReactNode }) {
  const hdrs       = await headers();
  const tenantSlug = hdrs.get('x-tenant-slug') ?? '';
  const tenantName = tenantSlug
    ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)
    : 'Estética';

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6">
      <CalendarsSidebar tenantName={tenantName} />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-(--color-spa-bg)">
        {children}
      </main>
    </div>
  );
}

export default function AgendaLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <span className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AgendaShell>{children}</AgendaShell>
    </Suspense>
  );
}
