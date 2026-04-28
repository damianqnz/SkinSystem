'use client';

import { useState, useTransition } from 'react';
import { Loader2, Mail, ChevronRight }         from 'lucide-react';
import { createSupabaseClient }                from '@/infrastructure/supabase/client';
import { bookT }                               from '../_i18n';

// ── Props ─────────────────────────────────────────────────────

interface Step2AuthProps {
  loginRequired:     boolean;
  locale:            string;
  onAuthenticated:   () => void;
  onContinueAsGuest: () => void;
}

type AuthView = 'options' | 'login' | 'register';

// ── Google icon ────────────────────────────────────────────────

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

// ── Component ─────────────────────────────────────────────────

export function Step2Auth({
  loginRequired,
  locale,
  onAuthenticated,
  onContinueAsGuest,
}: Step2AuthProps) {
  const tAll = bookT(locale);
  const t    = tAll.auth;

  const [view,        setView]         = useState<AuthView>('options');
  const [authError,   setAuthError]    = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState<'google' | null>(null);
  const [isPending,   startTransition] = useTransition();

  const supabase = createSupabaseClient();

  // ── OAuth helper ───────────────────────────────────────────
  async function signInWithOAuth(provider: 'google') {
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

  // ── Email login ────────────────────────────────────────────
  function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    const fd    = new FormData(e.currentTarget);
    const email = fd.get('email') as string;
    const pass  = fd.get('password') as string;

    startTransition(async () => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) { setAuthError(t.errorCredentials); return; }
      onAuthenticated();
    });
  }

  // ── Email register ─────────────────────────────────────────
  function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setAuthError(null);
    const fd       = new FormData(e.currentTarget);
    const fullName = fd.get('fullName') as string;
    const email    = fd.get('email') as string;
    const pass     = fd.get('password') as string;

    startTransition(async () => {
      const { error } = await supabase.auth.signUp({
        email,
        password: pass,
        options: { data: { full_name: fullName } },
      });
      if (error) { setAuthError(error.message); return; }
      onAuthenticated();
    });
  }

  const inputClass =
    'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 ' +
    'placeholder:text-stone-300 transition-colors';

  // ── Login form ─────────────────────────────────────────────
  if (view === 'login') {
    return (
      <div>
        <button type="button" onClick={() => { setView('options'); setAuthError(null); }}
          className="text-xs text-stone-400 hover:text-stone-700 mb-5 transition-colors">
          {t.back}
        </button>
        <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-1 text-center">
          {t.headingLogin}
        </h2>
        <p className="text-xs text-stone-400 text-center mb-6">{t.subtitleLogin}</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="field-label">{t.emailLabel}</label>
            <input name="email" type="email" required
              placeholder={t.emailPlaceholder}
              className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="field-label">{t.passwordLabel}</label>
            <input name="password" type="password" required
              placeholder={t.passwordPlaceholder}
              className={`mt-1.5 ${inputClass}`} />
          </div>

          {authError && <p className="text-sm text-red-500">{authError}</p>}

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-stone-900 text-white font-outfit font-medium text-sm rounded-xl hover:bg-stone-700 disabled:opacity-60 transition-colors">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : t.enter}
          </button>

          <button type="button" onClick={() => { setView('register'); setAuthError(null); }}
            className="w-full text-xs text-stone-400 hover:text-stone-700 transition-colors pt-1">
            {t.noAccount} <span className="underline">{t.createNow}</span>
          </button>
        </form>
      </div>
    );
  }

  // ── Register form ──────────────────────────────────────────
  if (view === 'register') {
    return (
      <div>
        <button type="button" onClick={() => { setView('options'); setAuthError(null); }}
          className="text-xs text-stone-400 hover:text-stone-700 mb-5 transition-colors">
          {t.back}
        </button>
        <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-1 text-center">
          {t.headingRegister}
        </h2>
        <p className="text-xs text-stone-400 text-center mb-6">{t.subtitleRegister}</p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="field-label">{t.fullNameLabel}</label>
            <input name="fullName" type="text" required minLength={2}
              placeholder={t.fullNamePlaceholder}
              className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="field-label">{t.emailLabel}</label>
            <input name="email" type="email" required
              placeholder={t.emailPlaceholder}
              className={`mt-1.5 ${inputClass}`} />
          </div>
          <div>
            <label className="field-label">{t.passwordLabel}</label>
            <input name="password" type="password" required minLength={6}
              placeholder={t.passwordMinPlaceholder}
              className={`mt-1.5 ${inputClass}`} />
          </div>

          {authError && <p className="text-sm text-red-500">{authError}</p>}

          <button type="submit" disabled={isPending}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 bg-stone-900 text-white font-outfit font-medium text-sm rounded-xl hover:bg-stone-700 disabled:opacity-60 transition-colors">
            {isPending ? <Loader2 size={16} className="animate-spin" /> : t.createAccount}
          </button>
        </form>
      </div>
    );
  }

  // ── Options view ───────────────────────────────────────────
  return (
    <div>
      <h2 className="font-cormorant text-2xl font-semibold text-stone-900 mb-1 text-center">
        {t.headingOptions}
      </h2>
      <p className="text-xs text-stone-400 text-center mb-8">
        {t.subtitleOptions}
      </p>

      <div className="space-y-3">

        {/* Google */}
        <button
          type="button"
          onClick={() => signInWithOAuth('google')}
          disabled={oauthLoading !== null}
          className="w-full flex items-center gap-3 px-4 py-3 border border-stone-200 rounded-xl bg-white text-sm font-outfit text-stone-700 hover:bg-stone-50 disabled:opacity-60 transition-colors"
        >
          {oauthLoading === 'google'
            ? <Loader2 size={18} className="animate-spin text-stone-400" />
            : <GoogleIcon />}
          <span>{t.google}</span>
          {oauthLoading !== 'google' && <ChevronRight size={14} className="ml-auto text-stone-300" />}
        </button>

        {/* Apple — pendiente de Apple Developer membership */}

        {/* Email */}
        <button
          type="button"
          onClick={() => setView('login')}
          className="w-full flex items-center gap-3 px-4 py-3 border border-stone-200 rounded-xl bg-white text-sm font-outfit text-stone-700 hover:bg-stone-50 transition-colors"
        >
          <Mail size={18} className="text-stone-400" />
          <span>{t.email}</span>
          <ChevronRight size={14} className="ml-auto text-stone-300" />
        </button>

        {/* Criar Perfil */}
        <button
          type="button"
          onClick={() => setView('register')}
          className="w-full flex items-center gap-3 px-4 py-3 border border-stone-200 rounded-xl bg-white text-sm font-outfit text-stone-600 hover:bg-stone-50 transition-colors"
        >
          <span className="text-base leading-none text-stone-400">+</span>
          <span>{t.createProfile}</span>
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
            <span className="text-xs text-stone-300 font-outfit">{t.or}</span>
            <div className="flex-1 h-px bg-stone-100" />
          </div>
          <button
            type="button"
            onClick={onContinueAsGuest}
            className="text-sm text-stone-400 hover:text-stone-700 underline underline-offset-2 transition-colors"
          >
            {t.continueGuest}
          </button>
        </div>
      )}
    </div>
  );
}
