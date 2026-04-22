import { Suspense } from 'react';
import Link from 'next/link';
import { UserMenu, UserMenuSkeleton } from './UserMenu';

/**
 * Glassmorphism header — Server Component.
 * UserMenu is isolated in <Suspense> for PPR compatibility.
 *
 * Structure:
 *   [Left: empty]  [Right: Reservar CTA + Avatar+Logout dropdown]
 */
export function DashboardHeader() {
  return (
    <header
      className="sticky top-0 z-20 h-14 flex items-center justify-between px-6
                 bg-[rgba(245,243,239,0.80)] backdrop-blur-md
                 border-b border-spa-border"
    >
      {/* ── Left: spacer ─────────────────────────────────────── */}
      <div />

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

        {/* User avatar with logout dropdown — streamed */}
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
