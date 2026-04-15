import { Suspense } from 'react';
import { UserMenu, UserMenuSkeleton } from './UserMenu';

interface DashboardHeaderProps {
  tenantName: string;
}

/**
 * Glassmorphism header — Server Component.
 * Receives tenantName as prop (no headers() call here) → static-prerenderable.
 * The UserMenu is isolated in <Suspense> for PPR compatibility.
 */
export function DashboardHeader({ tenantName }: DashboardHeaderProps) {
  return (
    <header
      className="sticky top-0 z-20 h-14 flex items-center justify-between px-6
                 bg-[rgba(250,250,249,0.75)] backdrop-blur-md
                 border-b border-[var(--color-spa-border)]"
    >
      {/* Brand name — Cormorant Garamond */}
      <h1
        className="text-lg leading-none tracking-wide capitalize"
        style={{ fontFamily: 'var(--font-serif)' }}
      >
        {tenantName}
      </h1>

      {/* Actions */}
      <div className="flex items-center gap-4">
        <Suspense fallback={<UserMenuSkeleton />}>
          <UserMenu />
        </Suspense>
      </div>
    </header>
  );
}
