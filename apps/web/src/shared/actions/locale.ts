'use server';

/**
 * @file shared/actions/locale.ts
 * @description Locale persistence Server Action, shared by every consumer-facing
 *              route group.
 *
 * Lives in `shared/` rather than inside a route group because both `(tenant)`
 * and `(account)` render the same `LanguageSwitcher`; keeping it in one group
 * would force the other to import across a route-group boundary.
 */

import { z }              from 'zod';
import { cookies }        from 'next/headers';
import { revalidatePath } from 'next/cache';
import { SUPPORTED_LOCALES } from '@/i18n/config';

// ── Schema (Validation Law — Zod on every input) ──────────────

const localeSchema = z.enum(SUPPORTED_LOCALES);

/**
 * `message` is a developer-facing diagnostic, never rendered: the only caller
 * discards the result, because an invalid locale can only come from a tampered
 * request, not from the three-option switcher.
 */
export type LocaleState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

/**
 * Persists the user's chosen locale into the `NEXT_LOCALE` cookie
 * and revalidates the root layout so Server Components re-render
 * with the new language.
 *
 * Cookie flags mirror those used by `proxy.ts` so that the proxy
 * and this action stay in sync.
 */
export async function setLocaleAction(raw: unknown): Promise<LocaleState> {
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
