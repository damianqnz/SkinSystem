'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Share2, Zap } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { NAV_ITEMS } from './nav-items';

interface SidebarProps { tenantName: string }

// ── Shimmer skeleton for tenant name while loading ─────────────────
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

// ── Main Sidebar ───────────────────────────────────────────────────
export function Sidebar({ tenantName }: SidebarProps) {
  const pathname = usePathname();

  // Derive initials from tenant name for the logo circle
  const initials = tenantName
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase() || 'LE';

  return (
    <aside
      className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64
                 bg-[#F5F3EF] border-r border-spa-border z-30"
    >
      {/* ── Brand / Logo area ──────────────────────────────────── */}
      <div
        className="px-5 pt-5 pb-4 border-b border-spa-border"
      >
        {/* Icon circle — tenant logo placeholder */}
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center mb-3
                     bg-[var(--color-spa-stone)] text-white text-[11px] font-medium tracking-wide"
          style={{ fontFamily: 'var(--font-sans)' }}
          aria-hidden
        >
          {initials}
        </div>

        {/* Tenant name */}
        <p
          className="text-[15px] leading-snug text-(--color-spa-stone) tracking-wide capitalize"
          style={{ fontFamily: 'var(--font-serif)' }}
        >
          {tenantName}
        </p>
      </div>

      {/* ── Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5 no-scrollbar" aria-label="Navegação principal">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href ||
            (href !== '/dashboard' && href !== '/dashboard/settings' && pathname.startsWith(href));

          return (
            <Link
              key={`${href}-${label}`}
              href={href}
              className={cn(
                'relative group flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition-all duration-150',
                active
                  ? 'bg-[rgba(212,175,55,0.10)] text-[#D4AF37] font-medium'
                  : 'text-[var(--color-spa-muted)] hover:text-[var(--color-spa-stone)] hover:bg-stone-100/80',
              )}
              style={{ fontFamily: 'var(--font-sans)' }}
              aria-current={active ? 'page' : undefined}
            >
              {/* Gold left-border accent for active item */}
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
      <div className="border-t border-spa-border px-3 py-4 space-y-2">
        {/* Share public page link */}
        <Link
          href="/book"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px]
                     text-spa-muted hover:text-(--color-spa-stone)
                     hover:bg-stone-100/80 transition-colors duration-150"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <Share2 size={14} strokeWidth={1.5} className="shrink-0" />
          <span>Compartilhar link da página pública</span>
        </Link>

        {/* Upsell strip */}
        <div
          className="mx-1 rounded-xl border border-[#D4AF37]/30 bg-[rgba(212,175,55,0.06)]
                     px-3 py-2.5 flex flex-col gap-1.5"
        >
          <div className="flex items-center gap-1.5">
            <Zap size={12} strokeWidth={1.5} className="text-[#D4AF37] shrink-0" />
            <span
              className="text-[11px] font-medium text-(--color-spa-stone) leading-tight"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              Desbloquear agendamento Pro
            </span>
          </div>
          <Link
            href="/dashboard/settings"
            className="inline-block w-full text-center text-[11px] font-medium
                       bg-[#D4AF37] text-white rounded-lg py-1.5 px-3
                       hover:bg-[#C09A28] transition-colors duration-150"
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            Assine o Pro
          </Link>
        </div>
      </div>
    </aside>
  );
}
