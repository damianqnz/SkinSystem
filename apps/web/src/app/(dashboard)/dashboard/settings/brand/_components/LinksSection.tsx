'use client';

import { useState, useTransition } from 'react';
import { Loader2 }                  from 'lucide-react';
import { toast }                    from 'sonner';
import { updateLinksAction }        from '../actions';

// ── Types ─────────────────────────────────────────────────────

interface Props {
  initial: {
    website:   string;
    instagram: string;
    facebook:  string;
    tiktok:    string;
    youtube:   string;
    linkedin:  string;
    pinterest: string;
  };
}

// ── Fields config ─────────────────────────────────────────────

const LINKS_FIELDS = [
  { id: 'website',   label: 'Site',      placeholder: 'https://seu-site.com' },
  { id: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/seu-perfil' },
  { id: 'facebook',  label: 'Facebook',  placeholder: 'https://facebook.com/sua-pagina' },
  { id: 'tiktok',    label: 'TikTok',    placeholder: 'https://tiktok.com/@seu-perfil' },
  { id: 'youtube',   label: 'YouTube',   placeholder: 'https://youtube.com/@seu-canal' },
  { id: 'linkedin',  label: 'LinkedIn',  placeholder: 'https://linkedin.com/company/sua-empresa' },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/seu-perfil' },
] as const;

type LinkField = typeof LINKS_FIELDS[number]['id'];

// ── Helper ─────────────────────────────────────────────────────

function notifyPreview() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
}

// ── Component ─────────────────────────────────────────────────

export function LinksSection({ initial }: Props) {
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

  function handleChange(field: LinkField, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    startTransition(async () => {
      const result = await updateLinksAction(values);
      if (result.error) { toast.error(result.error.message); return; }
      toast.success('Links guardados');
      notifyPreview();
    });
  }

  return (
    <section id="links" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          Seus links
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Direcione visitantes para o seu site, redes sociais e muito mais.
        </p>
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {LINKS_FIELDS.map((field) => (
          <div key={field.id} className="space-y-1.5">
            <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
              {field.label}
            </label>
            <input
              type="url"
              value={values[field.id]}
              onChange={(e) => handleChange(field.id, e.target.value)}
              placeholder={field.placeholder}
              className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
            />
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="flex justify-end pt-1">
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Guardar
        </button>
      </div>
    </section>
  );
}
