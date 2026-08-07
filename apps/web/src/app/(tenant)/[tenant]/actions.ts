'use server';

/**
 * @file (tenant)/[tenant]/actions.ts
 * @description Server Actions scoped to the tenant's public site.
 *
 * - `signOutAction` — called from the tenant navbar `UserMenu`. Clears the
 *   Supabase session cookies and returns the user to the tenant landing.
 *
 * Locale persistence lives in `@/shared/actions/locale`: `(account)` renders
 * the same switcher, so it cannot live inside a single route group.
 */

import { cookies }                   from 'next/headers';
import { redirect }                  from 'next/navigation';
import { revalidatePath }            from 'next/cache';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';

// ── signOutAction ─────────────────────────────────────────────

/**
 * Clears the Supabase session for the current browser and sends the user back
 * to the tenant landing. Used by the public navbar `UserMenu` (both customer
 * and staff flows; the redirect stays on the same subdomain).
 *
 * `redirect()` throws a Next.js control-flow error — it MUST live outside a
 * try/catch.
 */
export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();

  // Drop the staff-only dashboard locale mirror so the next user on this
  // browser doesn't inherit the previous staff's language preference.
  const cookieStore = await cookies();
  cookieStore.delete('DASHBOARD_LOCALE');

  revalidatePath('/', 'layout');
  redirect('/');
}
