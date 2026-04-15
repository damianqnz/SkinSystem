import { createSupabaseServerClient } from '@/infrastructure/supabase/server';

/**
 * Async Server Component — fetches the active user session.
 * Rendered inside <Suspense> in DashboardHeader so the static shell
 * is not blocked (PPR-compatible).
 */
export async function UserMenu() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const initials = (user.email ?? '?')
    .split('@')[0]
    ?.slice(0, 2)
    .toUpperCase() ?? '??';

  return (
    <div className="flex items-center gap-3">
      <div
        className="w-8 h-8 rounded-full bg-[var(--color-spa-stone)] text-white
                   flex items-center justify-center text-[11px] font-medium"
        aria-label={`User: ${user.email}`}
      >
        {initials}
      </div>
      <span className="hidden lg:block text-sm text-[var(--color-spa-muted)] truncate max-w-[140px]">
        {user.email}
      </span>
    </div>
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-stone-200" />
      <div className="hidden lg:block w-28 h-3 rounded bg-stone-200" />
    </div>
  );
}
