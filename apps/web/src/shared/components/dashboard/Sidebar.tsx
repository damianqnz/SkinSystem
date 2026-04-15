'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS } from './nav-items';

interface SidebarProps { tenantName: string }

export function Sidebar({ tenantName }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-60 bg-white border-r border-[var(--color-spa-border)] z-30">
      <div className="flex items-end h-16 px-6 border-b border-[var(--color-spa-border)]">
        <span
          className="text-xl leading-none pb-0.5"
          style={{ fontFamily: 'var(--font-serif)', letterSpacing: '0.02em' }}
        >
          {tenantName}
        </span>
      </div>
      <nav className="flex-1 py-4 space-y-0.5 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors rounded-none',
                active
                  ? 'bg-[var(--color-spa-stone)] text-white'
                  : 'text-[var(--color-spa-muted)] hover:text-[var(--color-spa-stone)] hover:bg-stone-50',
              )}
            >
              <Icon size={16} strokeWidth={1.5} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="h-12 px-6 flex items-center">
        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" aria-hidden />
      </div>
    </aside>
  );
}
