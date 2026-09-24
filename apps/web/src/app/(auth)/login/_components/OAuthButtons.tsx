'use client';

import { useState } from 'react';
import { Apple, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  resolveEnabledOAuthProviders,
  type OAuthProvider,
} from '@/infrastructure/auth/oauth-providers';
import { createSupabaseClient } from '@/infrastructure/supabase/client';
import { cn } from '@/shared/lib/utils';

/**
 * Social sign-in (OAuth) buttons — TIER 1 passwordless, a sibling to <OtpForm />.
 *
 * Google always shows; Apple only when NEXT_PUBLIC_SUPABASE_APPLE_ENABLED is
 * exactly the string 'true' (the gate lives in `resolveEnabledOAuthProviders`).
 * `NEXT_PUBLIC_*` is inlined at build time, so the provider list is a build-time
 * constant — resolved once here rather than on every render.
 *
 * `redirectTo` intentionally carries NO `?next=` param: the shared post-auth
 * resolver routes each user by role (staff → dashboard, customer → /me),
 * mirroring the OTP magic-link decision.
 *
 * Reads the `auth.login` namespace, which is allow-listed for the (auth) group.
 */
const PROVIDERS = resolveEnabledOAuthProviders({
  appleEnabled: process.env.NEXT_PUBLIC_SUPABASE_APPLE_ENABLED,
});

export function OAuthButtons() {
  const t = useTranslations('auth.login');
  const [loading, setLoading] = useState<OAuthProvider | null>(null);
  const [failed, setFailed] = useState(false);

  async function handleSignIn(provider: OAuthProvider) {
    setLoading(provider);
    setFailed(false);

    const supabase = createSupabaseClient();
    const redirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    // On success the browser redirects away — this is only reached on error.
    if (error) {
      setFailed(true);
      setLoading(null);
    }
  }

  return (
    <div className="w-full">
      {/* ── Error ──────────────────────────────────────────── */}
      {failed && (
        <div
          role="alert"
          className="mb-4 flex items-start gap-3 border border-red-200 bg-red-50 px-4 py-3"
        >
          <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
          <p className="font-sans text-sm text-red-700">{t('errors.generic')}</p>
        </div>
      )}

      {/* ── One bordered button per enabled provider ────────── */}
      <div className="space-y-3">
        {PROVIDERS.map((provider) => {
          const isLoading = loading === provider;
          return (
            <button
              key={provider}
              type="button"
              onClick={() => handleSignIn(provider)}
              disabled={loading !== null}
              className={cn(
                'flex h-11 w-full items-center justify-center gap-3',
                'border border-stone-200 bg-white',
                'font-sans text-[11px] font-medium tracking-[0.18em] uppercase text-stone-700',
                'transition-colors duration-200',
                'hover:bg-stone-50',
                'disabled:cursor-not-allowed disabled:opacity-50',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stone-900 focus-visible:ring-offset-2',
              )}
            >
              {isLoading ? (
                <Loader2 size={16} strokeWidth={1.5} className="animate-spin text-stone-400" />
              ) : (
                <ProviderMark provider={provider} />
              )}
              <span>{t(`providers.${provider}`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProviderMark({ provider }: { provider: OAuthProvider }) {
  if (provider === 'apple') {
    return <Apple size={16} strokeWidth={1.5} className="text-stone-800" aria-hidden />;
  }
  return <GoogleMark />;
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 33.656 29.25 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.39C34.522 6.483 29.461 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.39C34.522 6.483 29.461 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.232 0-9.624-3.324-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}
