'use client';

import { useState, useTransition } from 'react';
import { Loader2 }                  from 'lucide-react';
import { toast }                    from 'sonner';
import { useTranslations }          from 'next-intl';
import { updateLinksAction }        from '../actions';

type LinkField = 'website' | 'instagram' | 'facebook' | 'tiktok' | 'youtube' | 'linkedin' | 'pinterest';

const LINK_IDS: readonly LinkField[] = ['website', 'instagram', 'facebook', 'tiktok', 'youtube', 'linkedin', 'pinterest'];

interface Props {
  initial: Record<LinkField, string>;
}

function notifyPreview() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
}

export function LinksSection({ initial }: Props) {
  const t = useTranslations('dashboard.settings.brand.links');
  const [values, setValues] = useState<Record<LinkField, string>>({
    website:   initial.website   || '',
    instagram: initial.instagram || '',
    facebook:  initial.facebook  || '',
    tiktok:    initial.tiktok    || '',
    youtube:   initial.youtube   || '',
    linkedin:  initial.linkedin  || '',
    pinterest: initial.pinterest || '',
  });
  const [isPending, startTransition] = useTransition();

  // Pre-build field labels and placeholders for type-safe access
  const fieldDefs: Record<LinkField, { label: string; placeholder: string }> = {
    website:   { label: t('fields.websiteLabel'),       placeholder: t('fields.websitePlaceholder')       },
    instagram: { label: t('fields.instagramLabel'),     placeholder: t('fields.instagramPlaceholder')     },
    facebook:  { label: t('fields.facebookLabel'),      placeholder: t('fields.facebookPlaceholder')      },
    tiktok:    { label: t('fields.tiktokLabel'),        placeholder: t('fields.tiktokPlaceholder')        },
    youtube:   { label: t('fields.youtubeLabel'),       placeholder: t('fields.youtubePlaceholder')       },
    linkedin:  { label: t('fields.linkedinLabel'),      placeholder: t('fields.linkedinPlaceholder')      },
    pinterest: { label: t('fields.pinterestLabel'),     placeholder: t('fields.pinterestPlaceholder')     },
  };

  function handleChange(field: LinkField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateLinksAction(values);
      if (result.error) { toast.error(result.error.message); return; }
      toast.success(t('successSave'));
      notifyPreview();
    });
  }

  return (
    <section id="links" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">{t('sectionTitle')}</h2>
        <p className="text-sm text-stone-500 mt-1">{t('sectionDesc')}</p>
      </div>

      <div className="space-y-4">
        {LINK_IDS.map((id) => (
          <div key={id} className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              {fieldDefs[id].label}
            </label>
            <input
              type="url"
              value={values[id]}
              onChange={(e) => handleChange(id, e.target.value)}
              placeholder={fieldDefs[id].placeholder}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
            />
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-1">
        <button onClick={handleSave} disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
          {isPending && <Loader2 size={13} className="animate-spin" />}
          {t('save')}
        </button>
      </div>
    </section>
  );
}
