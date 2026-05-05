'use client';

import Link                  from 'next/link';
import { usePathname }       from 'next/navigation';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn }                from '@/shared/lib/utils';
import { getNavItems }       from './nav-items';
import { useSidebarCtx }     from './SidebarContext';
import { useTenantContext }  from '@/shared/providers/TenantProvider';

const SIDEBAR_LABELS: Record<'pt' | 'es' | 'en', { collapse: string; expand: string }> = {
  pt: { collapse: 'Recolher menu', expand: 'Expandir menu'  },
  es: { collapse: 'Contraer menú', expand: 'Expandir menú'  },
  en: { collapse: 'Collapse menu', expand: 'Expand menu'    },
};

interface SidebarProps { tenantName: string }

// ── Shimmer skeleton ───────────────────────────────────────────
export function SidebarSkeleton() {
  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-[#F5F3EF] border-r border-spa-border z-30 animate-pulse">
      <div className="h-[72px] px-5 flex flex-col justify-center gap-1.5 border-b border-spa-border">
        <div className="w-8 h-8 rounded-full bg-stone-200 skeleton-shimmer" />
        <div className="w-36 h-3.5 rounded bg-stone-200 skeleton-shimmer" />
      </div>
      <div className="flex-1 py-5 px-3 space-y-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="h-9 rounded-lg bg-stone-200/60 skeleton-shimmer mx-1" />
        ))}
      </div>
    </aside>
  );
}

// ── Main Sidebar ───────────────────────────────────────────────
export function Sidebar({ tenantName }: SidebarProps) {
  const pathname  = usePathname();
  const { collapsed, toggle } = useSidebarCtx();
  const { locale } = useTenantContext();

  const navItems = getNavItems(locale);
  const labels   = SIDEBAR_LABELS[(locale as 'pt' | 'es' | 'en')] ?? SIDEBAR_LABELS['pt'];

  const initials = tenantName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'LE';

  // ── Collapsed rail ────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside
        className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-10
                   bg-[#F5F3EF] border-r border-spa-border z-30"
        style={{ transition: 'width 0.2s ease' }}
      >
        <div className="flex items-center justify-center pt-5 pb-4">
          <button
            onClick={toggle}
            title={labels.expand}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <PanelLeftOpen size={15} />
          </button>
        </div>

        {/* Icon-only nav items */}
        <nav className="flex-1 flex flex-col items-center py-2 gap-1" aria-label="Navegação principal">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href ||
              (href !== '/dashboard' && href !== '/dashboard/settings' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className={cn(
                  'p-2 rounded-lg transition-all duration-150',
                  active
                    ? 'bg-[rgba(212,175,55,0.10)] text-[#D4AF37]'
                    : 'text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100/80',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={16} strokeWidth={active ? 1.75 : 1.5} className="shrink-0" />
              </Link>
            );
          })}
        </nav>
      </aside>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────
  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64
                 bg-[#F5F3EF] border-r border-spa-border z-30"
      style={{ transition: 'width 0.2s ease' }}
    >
      {/* ── Brand / Logo area ──────────────────────────────────── */}
      <div className="px-5 pt-5 pb-4 border-b border-spa-border">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center mb-3
                     bg-(--color-spa-stone) text-white text-[11px] font-medium tracking-wide"
          style={{ fontFamily: 'var(--font-sans)' }}
          aria-hidden
        >
          {initials}
        </div>
        <p
          className="text-[15px] leading-snug text-(--color-spa-stone) tracking-wide capitalize"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {tenantName}
        </p>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar" aria-label="Navegação principal">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && href !== '/dashboard/settings' && pathname.startsWith(href));

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150',
                active
                  ? 'bg-[rgba(212,175,55,0.10)] text-[#D4AF37] font-medium'
                  : 'text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100/80',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
              aria-current={active ? 'page' : undefined}
            >
              <span
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full transition-all duration-200',
                  active ? 'h-5 bg-[#D4AF37]' : 'h-0 bg-transparent',
                )}
                aria-hidden
              />
              <Icon
                size={16}
                strokeWidth={active ? 1.75 : 1.5}
                className={cn(
                  'shrink-0 transition-colors duration-150',
                  active ? 'text-[#D4AF37]' : 'text-spa-muted group-hover:text-(--color-spa-stone)',
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <div className="border-t border-spa-border px-3 py-4">
        <button
          onClick={toggle}
          title={labels.collapse}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs
                     text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <PanelLeftClose size={13} className="shrink-0" />
          <span>{labels.collapse}</span>
        </button>
      </div>
    </aside>
  );
}
