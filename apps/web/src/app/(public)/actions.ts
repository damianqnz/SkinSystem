'use server';

/**
 * @file (public)/actions.ts
 * @description Server Actions shared across the public (consumer) segment.
 *
 * - `setLocaleAction` — called from the navbar `LanguageSwitcher` to persist
 *   the user's manual language choice into the `NEXT_LOCALE` cookie (same
 *   cookie the proxy reads on every request).
 * - `signOutAction`   — called from the public navbar `UserMenu`. Clears the
 *   Supabase session cookies and returns the user to the tenant landing.
 */

import { z }                         from 'zod';
import { cookies }                   from 'next/headers';
import { redirect }                  from 'next/navigation';
import { revalidatePath }            from 'next/cache';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';

// ── Schema (Validation Law — Zod on every input) ──────────────

const localeSchema = z.enum(['es', 'pt', 'en']);

export type LocaleState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

// ── setLocaleAction ───────────────────────────────────────────

/**
 * Persists the user's chosen locale into the `NEXT_LOCALE` cookie
 * and revalidates the root layout so Server Components re-render
 * with the new language.
 *
 * Cookie flags mirror those used by `proxy.ts` so that the proxy
 * and this action stay in sync.
 */
export async function setLocaleAction(
  raw: unknown,
): Promise<LocaleState> {
  const parsed = localeSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: 'error', message: 'Invalid locale' };
  }

  const store = await cookies();
  store.set('NEXT_LOCALE', parsed.data, {
    path:     '/',
    sameSite: 'lax',
    secure:   process.env.NODE_ENV === 'production',
    maxAge:   60 * 60 * 24 * 365, // 1 year
  });

  revalidatePath('/', 'layout');
  return { status: 'success' };
}

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
