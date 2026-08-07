/**
 * @file (account)/layout.tsx
 * @description Root layout for the end customer's account area.
 *
 * Deliberately outside the tenant rewrite: the browser URL stays `/me`, and the
 * tenant is resolved from `x-tenant-slug` alone. The customer account is its
 * own product surface with its own guard (`me/layout.tsx`), so it does not
 * inherit anything from the specialist's marketing site.
 *
 * It still renders under the tenant's subdomain, so it paints the same brand.
 */

import type { ReactNode } from 'react';
import { headers }        from 'next/headers';
import { getBrandTheme }  from '@/shared/lib/brand-theme';
import { ConsumerShell }  from '@/shared/components/ConsumerShell';
import { localeFromHeader } from '@/i18n/detect-locale';
import '../globals.css';

export default async function AccountLayout({ children }: { children: ReactNode }) {
  const hdrs  = await headers();
  const theme = await getBrandTheme(hdrs.get('x-tenant-slug') ?? '');

  return (
    <ConsumerShell theme={theme} locale={localeFromHeader(hdrs.get('x-locale'))}>
      {children}
    </ConsumerShell>
  );
}
