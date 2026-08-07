/**
 * @file (tenant)/[tenant]/layout.tsx
 * @description Root layout for the specialist's public site.
 *
 * Only ever reached through the proxy rewrite (`/{slug}{pathname}`), so the
 * `[tenant]` param is proxy-issued, never user-typed. The guard below asserts
 * exactly that: if the param and `x-tenant-slug` disagree, the request did not
 * come from the rewrite and there is no safe tenant to render.
 *
 * `x-tenant-slug` — not the param — stays the single source of truth for the
 * whole app, because `(dashboard)` and `(account)` are not rewritten.
 */

import type { ReactNode } from 'react';
import { headers }        from 'next/headers';
import { notFound }       from 'next/navigation';
import { getBrandTheme }  from '@/shared/lib/brand-theme';
import { ConsumerShell }  from '@/shared/components/ConsumerShell';
import { localeFromHeader } from '@/i18n/detect-locale';
import '../../globals.css';

interface Props {
  children: ReactNode;
  params:   Promise<{ tenant: string }>;
}

export default async function TenantLayout({ children, params }: Props) {
  const [{ tenant }, hdrs] = await Promise.all([params, headers()]);
  const slug = hdrs.get('x-tenant-slug') ?? '';

  // Param/header drift means the segment was reached without the rewrite.
  if (!slug || tenant !== slug) notFound();

  const theme = await getBrandTheme(slug);

  return (
    <ConsumerShell theme={theme} locale={localeFromHeader(hdrs.get('x-locale'))}>
      {children}
    </ConsumerShell>
  );
}
