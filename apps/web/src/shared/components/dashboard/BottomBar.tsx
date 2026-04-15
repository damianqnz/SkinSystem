'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/shared/lib/utils';
import { BOTTOM_NAV_ITEMS } from './nav-items';

/**
 * Mobile bottom navigation — Thumb Zone law (DESIGN_SYSTEM.md §4.1).
 * Visible only on < md viewports. Glassmorphism bar at screen bottom.
 */
export function BottomBar() {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 h-16
                 bg-[rgba(250,250,249,0.85)] backdrop-blur-md
                 border-t border-[var(--color-spa-border)]
                 flex items-center justify-around px-2"
      aria-label="Mobile navigation"
    >
      {BOTTOM_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex flex-col items-center gap-1 min-w-[44px] min-h-[44px] justify-center',
              'text-[10px] font-[Outfit] transition-colors',
              active
                ? 'text-[var(--color-spa-stone)]'
                : 'text-[var(--color-spa-muted)]',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <Icon
              size={20}
              strokeWidth={active ? 2 : 1.5}
              className={active ? 'text-[#D4AF37]' : ''}
            />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
