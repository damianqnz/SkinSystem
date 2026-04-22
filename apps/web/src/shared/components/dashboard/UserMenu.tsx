import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { UserMenuClient } from './UserMenuClient';

/**
 * Async Server Component — fetches the active user session.
 * Rendered inside <Suspense> in DashboardHeader so the static shell
 * is not blocked (PPR-compatible).
 *
 * Delegates interactivity (dropdown, sign-out) to the client component.
 */
export async function UserMenu() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null;

  const initials = (user.email ?? '?')
    .split('@')[0]
    ?.slice(0, 2)
    .toUpperCase() ?? '??';

  const displayName = user.user_metadata?.full_name as string | undefined
    ?? user.email
    ?? '—';

  return (
    <UserMenuClient
      initials={initials}
      displayName={displayName}
      email={user.email ?? ''}
    />
  );
}

export function UserMenuSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-stone-200" />
    </div>
  );
}
