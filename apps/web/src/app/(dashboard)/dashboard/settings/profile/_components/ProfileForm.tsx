'use client';

import { useState, useTransition, useRef } from 'react';
import { Loader2, Upload, CheckCircle2 }   from 'lucide-react';
import { toast }                           from 'sonner';
import { useTranslations }                 from 'next-intl';
import { updateProfileAction, uploadProfileAvatarAction } from '../actions';
import { isValidImageFile, UPLOAD_MAX_MB }                from '@/shared/config/uploads';

interface Props {
  email: string;
  initial: {
    fullName:  string;
    phone:     string;
    avatarUrl: string | null;
  };
}

export function ProfileForm({ email, initial }: Props) {
  const t = useTranslations('dashboard.settings.profile');

  const [fullName, setFullName] = useState(initial.fullName);
  const [phone,    setPhone]    = useState(initial.phone);
  const [saved,    setSaved]    = useState(false);
  const [pending,  startTransition] = useTransition();

  const [avatarUrl,  setAvatarUrl]  = useState(initial.avatarUrl ?? '');
  const [uploading,  setUploading]  = useState(false);
  const avatarInput = useRef<HTMLInputElement>(null);

  function handleSave() {
    startTransition(async () => {
      const res = await updateProfileAction({ fullName, phone: phone || undefined });
      if (res.error) { toast.error(res.error.message); return; }
      setSaved(true);
      toast.success(t('toastSuccess'));
    });
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = isValidImageFile(file);
    if (!validation.ok) {
      toast.error(validation.reason === 'TOO_LARGE' ? t('errors.avatarTooLarge', { maxMb: UPLOAD_MAX_MB }) : t('errors.avatarInvalidType'));
      return;
    }

    const blobUrl = URL.createObjectURL(file);
    setAvatarUrl(blobUrl);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadProfileAvatarAction(fd);
      if (res.error || !res.data) {
        toast.error(res.error?.message ?? t('toastError'));
        setAvatarUrl(initial.avatarUrl ?? '');
        return;
      }
      setAvatarUrl(res.data.url);
    } finally {
      setUploading(false);
      URL.revokeObjectURL(blobUrl);
    }
  }

  const inputClass =
    'w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 ' +
    'placeholder:text-stone-300 transition-colors font-outfit';

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div
          className="relative w-16 h-16 rounded-full bg-stone-100 border-2 border-white shadow-md overflow-hidden cursor-pointer shrink-0"
          onClick={() => avatarInput.current?.click()}
        >
          {avatarUrl ? (
            // avatarUrl briefly holds a local `blob:` object URL for the instant upload
            // preview before the Supabase URL resolves; next/image cannot load blob: URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarUrl} alt={t('avatar.label')} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-400">
              <Upload size={16} strokeWidth={1.5} />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <Loader2 size={16} className="animate-spin text-stone-600" />
            </div>
          )}
          <input ref={avatarInput} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div>
          <button
            type="button"
            onClick={() => avatarInput.current?.click()}
            className="text-xs text-stone-600 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition-colors"
          >
            {avatarUrl ? t('avatar.change') : t('avatar.add')}
          </button>
          <p className="mt-1.5 text-[10px] text-stone-400 font-outfit">{t('avatar.hint', { maxMb: UPLOAD_MAX_MB })}</p>
        </div>
      </div>

      {/* Email — read-only from Supabase auth */}
      <div>
        <label className="block text-xs font-outfit font-medium text-stone-500 mb-1.5">{t('email.label')}</label>
        <div className="w-full border border-stone-100 rounded-xl px-4 py-3 text-sm text-stone-400 bg-stone-50 font-outfit select-none">
          {email}
        </div>
        <p className="mt-1.5 text-[10px] text-stone-400 font-outfit">{t('email.hint')}</p>
      </div>

      <div>
        <label className="block text-xs font-outfit font-medium text-stone-500 mb-1.5">{t('fullName.label')}</label>
        <input
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={fullName}
          placeholder={t('fullName.placeholder')}
          onChange={(e) => { setFullName(e.target.value); setSaved(false); }}
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-outfit font-medium text-stone-500 mb-1.5">{t('phone.label')}</label>
        <input
          type="tel"
          maxLength={30}
          value={phone}
          placeholder={t('phone.placeholder')}
          onChange={(e) => { setPhone(e.target.value); setSaved(false); }}
          className={inputClass}
        />
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || fullName.trim().length < 2}
          className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-outfit font-medium text-white bg-stone-900 rounded-xl hover:bg-stone-800 disabled:opacity-60 transition-colors shadow-sm"
        >
          {pending ? (
            <><Loader2 size={15} className="animate-spin" /> {t('saving')}</>
          ) : saved ? (
            <><CheckCircle2 size={15} /> {t('saved')}</>
          ) : (
            t('save')
          )}
        </button>
      </div>
    </div>
  );
}
