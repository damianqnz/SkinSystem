'use client';

import { useState, useTransition } from 'react';
import { Apple, Loader2, Mail, ChevronRight } from 'lucide-react';
import { useTranslations }                     from 'next-intl';
import { createSupabaseClient }                from '@/infrastructure/supabase/client';
import {
  resolveEnabledOAuthProviders,
  type OAuthProvider,
} from '@/infrastructure/auth/oauth-providers';

// ── Props ─────────────────────────────────────────────────────

interface Step2AuthProps {
  loginRequired:     boolean;
  onAuthenticated:   () => void;
  onContinueAsGuest: () => void;
}

type AuthView = 'options' | 'login';

type OtpState =
  | { status: 'idle' }
  | { status: 'sent'; email: string }
  | { status: 'rateLimited' };

// `NEXT_PUBLIC_*` is inlined at build time, so this list is a build-time
// constant — resolved once here rather than on every render, mirroring
// `OAuthButtons.tsx`. Apple ships inert until the flag is set (Req 9, H.7).
const PROVIDERS = resolveEnabledOAuthProviders({
  appleEnabled: process.env.NEXT_PUBLIC_SUPABASE_APPLE_ENABLED,
});

// ── Provider icons ────────────────────────────────────────────

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 33.656 29.25 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.39C34.522 6.483 29.461 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039L37.618 9.39C34.522 6.483 29.461 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.232 0-9.624-3.324-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

function ProviderIcon({ provider, loading }: { provider: OAuthProvider; loading: boolean }) {
  if (loading) return <Loader2 size={18} className="animate-spin text-stone-400" />;
  if (provider === 'apple') return <Apple size={18} className="text-stone-800" aria-hidden />;
  return <GoogleIcon />;
}

// ── Component ─────────────────────────────────────────────────

export function Step2Auth({
  loginRequired,
  onAuthenticated,
  onContinueAsGuest,
}: Step2AuthProps) {
  const t = useTranslations('booking.auth');

  const [view,        setView]         = useState<AuthView>('options');
  const [authError,   setAuthError]    = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [isPending,   startTransition] = useTransition();
  const [otpState,    setOtpState]     = useState<OtpState>({ status: 'idle' });
  const [otpPending,  setOtpPending]   = useState(false);

  const supabase = createSupabaseClient();

  // ── OAuth helper ───────────────────────────────────────────
  async function signInWithOAuth(provider: OAuthProvider) {
    setOauthLoading(provider);
    setAuthError(null);

    const redirectTo = `${window.location.origin}/auth/callback?next=/book`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });

    if (error) {
      setAuthError(error.message);
      setOauthLoading(null);
    }
    // On success the browser navigates away — no need to clear loading state
  }

  // ── Email login (password, for an already-activated customer) ──
  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    const fd    = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const pass  = fd.get('password') as string;

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { setAuthError(t('errorCredentials')); return; }
      onAuthenticated();
    });
  }

  // ── Passwordless OTP request ─────────────────────────────────
  // Anti-enumeration: the SAME "check your inbox" confirmation renders whether
  // or not a customers row exists for this email — the only outcome that
  // changes the UI is a 429 rate limit, which never claims the link was sent.
  async function handleOtpRequest(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd    = new FormData(e.currentTarget);
    const email = (fd.get('email') as string).trim();

    setOtpPending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm?next=/book`,
        shouldCreateUser: true,
      },
    });
    setOtpPending(false);

    if (error?.status === 429) {
      setOtpState({ status: 'rateLimited' });
      return;
    }
    // Success OR any other (non-429) error resolves identically.
    setOtpState({ status: 'sent', email });
  }

  const inputClass =
    'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 ' +
    'placeholder:text-stone-300 transition-colors';

  // ── Login view (passwordless primary, password secondary) ────
  if (view === 'login') {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            setView('options');
            setAuthError(null);
            setOtpState({ status: 'idle' });
          }}
          className="text-xs text-stone-400 hover:text-stone-700 mb-5 transition-colors"
        >
          {t('back')}
        </button>
        <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-1 text-center">
          {t('headingLogin')}
        </h2>
        <p className="text-xs text-stone-400 text-center mb-6">{t('subtitleLogin')}</p>

        {otpState.status === 'sent' ? (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-stone-200 bg-stone-50 px-4 py-4"
          >
            <span className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-stone-400" />
            <p className="text-sm leading-relaxed text-stone-600">
              {t('otpSent', { email: otpState.email })}
            </p>
          </div>
        ) : (
          <>
            {/* Passwordless — primary */}
            <form onSubmit={handleOtpRequest} className="space-y-4">
              <div>
                <label className="field-label">{t('emailLabel')}</label>
                <input name="email" type="email" required
                  placeholder={t('emailPlaceholder')}
                  className={`mt-1.5 ${inputClass}`} />
              </div>

              {otpState.status === 'rateLimited' && (
                <p className="text-sm text-red-500">{t('otpRateLimited')}</p>
              )}

              <button type="submit" disabled={otpPending}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-stone-900 text-white font-outfit font-medium text-sm rounded-xl hover:bg-stone-700 disabled:opacity-60 transition-colors">
                {otpPending ? <Loader2 size={16} className="animate-spin" /> : t('otpCta')}
              </button>
            </form>

            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-stone-100" />
              <span className="text-xs text-stone-300 font-outfit">{t('or')}</span>
              <div className="flex-1 h-px bg-stone-100" />
            </div>

            {/* Password — secondary, sign-in only, for an already-activated customer */}
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="field-label">{t('emailLabel')}</label>
                <input name="email" type="email" required
                  placeholder={t('emailPlaceholder')}
                  className={`mt-1.5 ${inputClass}`} />
              </div>
              <div>
                <label className="field-label">{t('passwordLabel')}</label>
                <input name="password" type="password" required
                  placeholder={t('passwordPlaceholder')}
                  className={`mt-1.5 ${inputClass}`} />
              </div>

              {authError && <p className="text-sm text-red-500">{authError}</p>}

              <button type="submit" disabled={isPending}
                className="w-full flex items-center justify-center gap-2 py-3 px-6 border border-stone-200 text-stone-700 font-outfit font-medium text-sm rounded-xl hover:bg-stone-50 disabled:opacity-60 transition-colors">
                {isPending ? <Loader2 size={16} className="animate-spin" /> : t('enter')}
              </button>
            </form>
          </>
        )}
      </div>
    );
  }

  // ── Options view ───────────────────────────────────────────
  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-1 text-center">
        {t('headingOptions')}
      </h2>
      <p className="text-xs text-stone-400 text-center mb-8">
        {t('subtitleOptions')}
      </p>

      <div className="space-y-3">

        {/* Google / Apple (Apple only when NEXT_PUBLIC_SUPABASE_APPLE_ENABLED === 'true') */}
        {PROVIDERS.map((provider) => (
          <button
            key={provider}
            type="button"
            onClick={() => signInWithOAuth(provider)}
            disabled={oauthLoading !== null}
            className="w-full flex items-center gap-3 px-4 py-3 border border-stone-200 rounded-xl bg-white text-sm font-outfit text-stone-700 hover:bg-stone-50 disabled:opacity-60 transition-colors"
          >
            <ProviderIcon provider={provider} loading={oauthLoading === provider} />
            <span>{t(provider)}</span>
            {oauthLoading !== provider && <ChevronRight size={14} className="ml-auto text-stone-300" />}
          </button>
        ))}

        {/* Email (passwordless OTP + secondary password) */}
        <button
          type="button"
          onClick={() => setView('login')}
          className="w-full flex items-center gap-3 px-4 py-3 border border-stone-200 rounded-xl bg-white text-sm font-outfit text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <Mail size={18} className="text-stone-400" />
          <span>{t('email')}</span>
          <ChevronRight size={14} className="ml-auto text-stone-300" />
        </button>
      </div>

      {authError && (
        <p className="mt-3 text-sm text-red-500 text-center">{authError}</p>
      )}

      {/* Guest option */}
      {!loginRequired && (
        <div className="mt-6 text-center">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-stone-100" />
            <span className="text-xs text-stone-300 font-outfit">{t('or')}</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="text-sm text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors"
          >
            {t('continueGuest')}
          </button>
        </div>
      )}
    </div>
  );
}
