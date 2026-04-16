import { Suspense } from 'react';
import Link from 'next/link';
import { UserMenu, UserMenuSkeleton } from './UserMenu';

interface DashboardHeaderProps {
  tenantName: string;
}

/**
 * Setmore-inspired glassmorphism header — Server Component.
 * Receives tenantName as prop (no headers() call) → static-prerenderable.
 * UserMenu is isolated in <Suspense> for PPR compatibility.
 *
 * Structure:
 *   [Left: section label]  [Center: "O seu calendário"]  [Right: Reservar CTA + Avatar]
 */
export function DashboardHeader({ tenantName: _tenantName }: DashboardHeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 h-14 flex items-center justify-between px-6
                 bg-[rgba(245,243,239,0.80)] backdrop-blur-md
                 border-b border-spa-border"
    >
      {/* ── Left: section label ──────────────────────────────────── */}
      <p
        className="text-[13px] text-spa-muted tracking-wide hidden lg:block"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        O seu calendário
      </p>

      {/* ── Center: brand title (visible on mobile / md) ─────────── */}
      <h1
        className="text-[17px] leading-none tracking-wide capitalize lg:absolute lg:left-1/2 lg:-translate-x-1/2"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        Lourdes Estética
      </h1>

      {/* ── Right: actions ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Reserve / book CTA — amber-gold */}
        <Link
          href="/book"
          className="shimmer-btn inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                     text-[12px] font-medium text-white
                     bg-[#D4AF37] hover:bg-[#C09A28]
                     transition-colors duration-200 shadow-sm"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          <span>Reservar</span>
        </Link>

        {/* User avatar — streamed */}
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
