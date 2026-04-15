import type { ReactNode } from 'react';
import { headers } from 'next/headers';

/**
 * Dashboard shell layout — specialist/admin views.
 * Reads `x-tenant-slug` injected by middleware.ts to scope
 * the session without relying on URL params.
 *
 * @note TenantProvider and sidebar will be added in the dashboard phase.
 */
export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = await headers();
  const tenantSlug = headersList.get('x-tenant-slug') ?? '';

  return (
    <div data-tenant={tenantSlug} className="flex min-h-screen">
      {/* Sidebar placeholder — will be replaced in dashboard phase */}
      <aside className="w-64 border-r border-stone-200 bg-white" />
      <main className="flex-1 bg-[#FAFAF9]">{children}</main>
    </div>
  );
}
