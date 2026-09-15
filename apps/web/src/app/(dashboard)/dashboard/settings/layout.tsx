import { Suspense }             from 'react';
import { headers }              from 'next/headers';
import { notFound }             from 'next/navigation';
import { resolvePreviewUrl }    from '@/infrastructure/tenant/preview-url';
import { SettingsSidebar }      from './_components/SettingsSidebar';
import { PreviewPanel }         from './_components/PreviewPanel';

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const hdrs       = await headers();
  const slug       = hdrs.get('x-tenant-slug') ?? '';
  const baseUrl    = process.env.NEXT_PUBLIC_BASE_URL ?? 'http://lvh.me:3000';

  const resolution = resolvePreviewUrl(slug, baseUrl);
  if (!resolution.ok) notFound();
  const { previewUrl, tenantSlug } = resolution;

  return (
    <div className="flex -m-6 overflow-hidden" style={{ height: 'calc(100vh - 65px)' }}>
      {/* Sub-sidebar — sticky column, its own scroll */}
      <Suspense fallback={<div className="w-60 flex-shrink-0 border-r border-stone-100 bg-[#FAFAF9] ml-1" />}>
        <SettingsSidebar tenantSlug={tenantSlug} />
      </Suspense>

      {/* Main content — only this column scrolls */}
      <main className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-6">
          {children}
        </div>
      </main>

      {/* Live preview — sticky column, its own scroll */}
      <PreviewPanel previewUrl={previewUrl} />
    </div>
  );
}
