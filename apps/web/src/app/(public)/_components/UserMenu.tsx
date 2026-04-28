'use client';

/**
 * @file UserMenu.tsx
 * @description Navbar user widget for the public (consumer) segment.
 *
 *  - Unauthenticated → User icon that links directly to `/login`.
 *  - Authenticated   → Avatar (Google/uploaded) OR name-initial in a chip,
 *                      which opens a Radix DropdownMenu with:
 *                        · "Mi cuenta"      → `/dashboard` for staff, `/me` for customers
 *                        · "Cerrar sesión"  → `signOutAction` (clears session + redirect `/`)
 *
 *  Copy honours the active locale (pt · es · en) matching the
 *  `LanguageSwitcher` and the rest of the public navbar.
 */

import { useTransition }   from 'react';
import Link                from 'next/link';
import * as DropdownMenu   from '@radix-ui/react-dropdown-menu';
import { User, LogOut, UserCircle } from 'lucide-react';
import { cn }              from '@/shared/lib/utils';
import { signOutAction }   from '../actions';

// ── Types ─────────────────────────────────────────────────────

type Locale = 'pt' | 'es' | 'en';

export interface PublicSessionUser {
  /** Display name — full name on profile/customer, falls back to email prefix. */
  displayName: string;
  /** Avatar URL (Google / uploaded). `null` → show an initial chip. */
  avatarUrl:   string | null;
  /** Where "Mi cuenta" should send the user. */
  accountHref: '/dashboard' | '/me';
}

interface Props {
  user:     PublicSessionUser | null;
  locale:   Locale;
  scrolled: boolean;
}

// ── Copy ──────────────────────────────────────────────────────

const COPY: Record<Locale, {
  loginAria:   string;
  menuAria:    string;
  account:     string;
  signOut:     string;
}> = {
  pt: { loginAria: 'Entrar',       menuAria: 'Menu da conta',    account: 'A minha conta', signOut: 'Terminar sessão' },
  es: { loginAria: 'Iniciar sesión', menuAria: 'Menú de la cuenta', account: 'Mi cuenta',     signOut: 'Cerrar sesión' },
  en: { loginAria: 'Sign in',      menuAria: 'Account menu',     account: 'My account',    signOut: 'Sign out' },
};

// ── Component ─────────────────────────────────────────────────

export function UserMenu({ user, locale, scrolled }: Props) {
  const [isPending, startTransition] = useTransition();
  const t = COPY[locale];

  // Shared button shape so the login trigger and the authed avatar button
  // line up visually with the `LanguageSwitcher`.
  const triggerClass = cn(
    'inline-flex items-center justify-center h-8 w-8 rounded-full transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'focus-visible:ring-[var(--brand-color)] focus-visible:ring-offset-transparent',
    scrolled
      ? 'text-stone-600 hover:text-stone-900 hover:bg-stone-100 dark:text-stone-400 dark:hover:text-stone-100 dark:hover:bg-stone-800'
      : 'text-white/80 hover:text-white hover:bg-white/10',
  );

  // ── Unauthenticated: direct link to /login ──────────────────
  if (!user) {
    return (
      <Link href="/login" aria-label={t.loginAria} className={triggerClass}>
        <User className="h-4 w-4" aria-hidden />
      </Link>
    );
  }

  // ── Authenticated: avatar or initial → dropdown ────────────
  const initial = user.displayName.trim().charAt(0).toUpperCase() || '·';

  const handleSignOut = () => {
    if (isPending) return;
    startTransition(async () => {
      await signOutAction();
    });
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          aria-label={t.menuAria}
          className={cn(
            triggerClass,
            'relative overflow-hidden border',
            scrolled ? 'border-stone-200 dark:border-stone-700' : 'border-white/20',
          )}
        >
          {user.avatarUrl ? (
            // Plain <img> on purpose — Google avatars aren't in the Next
            // image remotePatterns whitelist and we only need a 32px tile.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.avatarUrl}
              alt=""
              width={32}
              height={32}
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              className={cn(
                'text-[11px] font-outfit font-semibold tracking-wide',
                scrolled ? 'text-stone-700 dark:text-stone-200' : 'text-white',
              )}
            >
              {initial}
            </span>
          )}
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'z-[60] min-w-[12rem] rounded-xl border p-1 shadow-lg',
            'bg-white dark:bg-stone-900',
            'border-stone-200 dark:border-stone-800',
            'data-[state=open]:animate-in data-[state=closed]:animate-out',
            'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
            'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
          )}
        >
          {/* Header — shows who is logged in */}
          <div className="px-3 pt-2 pb-1">
            <p className="truncate font-outfit text-[12px] font-medium text-stone-900 dark:text-stone-100">
              {user.displayName}
            </p>
          </div>
          <DropdownMenu.Separator className="my-1 h-px bg-stone-100 dark:bg-stone-800" />

          <DropdownMenu.Item asChild>
            <Link
              href={user.accountHref}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2',
                'text-[13px] font-outfit text-stone-700 dark:text-stone-200 outline-none',
                'data-[highlighted]:bg-stone-100 dark:data-[highlighted]:bg-stone-800',
              )}
            >
              <UserCircle className="h-4 w-4" aria-hidden />
              <span>{t.account}</span>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item
            disabled={isPending}
            onSelect={(event) => {
              event.preventDefault();
              handleSignOut();
            }}
            className={cn(
              'flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2',
              'text-[13px] font-outfit text-stone-700 dark:text-stone-200 outline-none',
              'data-[highlighted]:bg-stone-100 dark:data-[highlighted]:bg-stone-800',
              'data-[disabled]:cursor-not-allowed data-[disabled]:opacity-60',
            )}
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>{t.signOut}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
