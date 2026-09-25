'use client';

import { useState }              from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast }                 from 'sonner';
import { useTranslations }       from 'next-intl';
import { createSupabaseClient }  from '@/infrastructure/supabase/client';
import { PASSWORD_MIN_LENGTH, setPasswordSchema } from '@/domains/customers/set-password-schema';

type Status = 'idle' | 'submitting' | 'success';

/**
 * D6 residual affordance (design section 4.3): "set a password" from an
 * already-authenticated session, via `supabase.auth.updateUser({ password })`
 * on the BROWSER client. Auth surface only — this never reads or writes the
 * `customers` table (Req 8). Password is secondary here by construction:
 * there is no code path that creates an account from a bare password, only
 * one that adds a password to an identity already verified by OTP/OAuth.
 */
export function SetPasswordForm() {
  const t = useTranslations('account.me.perfil.password');
  const [status, setStatus]         = useState<Status>('idle');
  const [fieldError, setFieldError] = useState<string | null>(null);

  const inputClass =
    'mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 ' +
    'placeholder:text-stone-300 transition-colors font-outfit';

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFieldError(null);

    const form   = e.currentTarget;
    const fd     = new FormData(form);
    const parsed = setPasswordSchema.safeParse({
      password:        fd.get('password'),
      confirmPassword: fd.get('confirmPassword'),
    });

    if (!parsed.success) {
      // The refine's mismatch issue is `code: 'custom'` on `confirmPassword`; a
      // too-short `confirmPassword` is a SEPARATE `too_small` issue on the same
      // path, so path alone cannot distinguish the two failure modes.
      const mismatch = parsed.error.issues.some((issue) => issue.code === 'custom');
      setFieldError(mismatch ? t('errors.mismatch') : t('errors.tooShort'));
      return;
    }

    setStatus('submitting');
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

    if (error) {
      setStatus('idle');
      const message =
        error.code === 'weak_password'
          ? t('errors.weakPassword')
          : error.code === 'reauthentication_needed'
            ? t('errors.reauthNeeded')
            : t('errors.generic');
      toast.error(message);
      return;
    }

    setStatus('success');
    toast.success(t('toastSuccess'));
    form.reset();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-cormorant text-lg font-semibold text-stone-900">{t('title')}</h3>
        <p className="text-xs text-stone-400 mt-0.5 font-outfit">{t('description')}</p>
      </div>

      <div>
        <label htmlFor="set-password-new" className="block text-xs font-outfit text-stone-500 mb-0">{t('newPassword.label')}</label>
        <input
          id="set-password-new"
          name="password"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          placeholder={t('newPassword.placeholder')}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="set-password-confirm" className="block text-xs font-outfit text-stone-500 mb-0">{t('confirmPassword.label')}</label>
        <input
          id="set-password-confirm"
          name="confirmPassword"
          type="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          placeholder={t('confirmPassword.placeholder')}
          className={inputClass}
        />
      </div>

      {fieldError && (
        <p role="alert" className="text-xs text-red-600 font-outfit">{fieldError}</p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-outfit font-medium text-stone-950 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm"
        style={{ backgroundColor: 'var(--brand-color)' }}
      >
        {status === 'submitting' ? (
          <><Loader2 size={15} className="animate-spin" /> {t('saving')}</>
        ) : status === 'success' ? (
          <><CheckCircle2 size={15} /> {t('saved')}</>
        ) : (
          t('cta')
        )}
      </button>
    </form>
  );
}
