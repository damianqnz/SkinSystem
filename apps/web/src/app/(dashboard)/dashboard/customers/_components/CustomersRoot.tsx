'use client';

import { usePathname } from 'next/navigation';
import { CustomersSidebar } from './CustomersSidebar';
import { cn } from '@/shared/lib/utils';
import type { CustomerSer } from './CustomerListItem';
import type { ReactNode } from 'react';

interface Props {
  customers: CustomerSer[];
  locale:    string;
  children:  ReactNode;
}

export function CustomersRoot({ customers, locale, children }: Props) {
  const pathname = usePathname();
  // Detect if we're on a customer detail page (has a UUID segment after /customers/)
  const isDetail = /\/customers\/[a-f0-9-]{36}/i.test(pathname);

  return (
    <div className="flex h-full min-h-0 overflow-hidden">
      {/* Sidebar: full-width on mobile list view, w-72 on desktop, hidden on mobile detail */}
      <aside
        className={cn(
          'flex-shrink-0 border-r border-[var(--color-spa-border)] bg-white flex flex-col',
          isDetail ? 'hidden md:flex md:w-72' : 'flex w-full md:w-72',
        )}
      >
        <CustomersSidebar customers={customers} locale={locale} />
      </aside>

      {/* Main panel: hidden on mobile when no customer selected */}
      <main
        className={cn(
          'flex-1 overflow-y-auto min-h-0',
          !isDetail && 'hidden md:block',
        )}
      >
        {children}
      </main>
    </div>
  );
}
