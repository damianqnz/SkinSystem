'use client';

import { useState, useTransition } from 'react';
import { Monitor, Sun, Moon, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updateAppearanceAction } from '../actions';
import { useSettingsT } from '../../_i18n';

interface Props {
  initial: {
    brandColor:  string;
    buttonShape: 'pill' | 'rounded' | 'rectangle';
    theme:       'system' | 'light' | 'dark';
  };
}

const PRESET_COLORS = [
  { name: 'Stone',  value: '#1C1917' },
  { name: 'Gold',   value: '#D4AF37' },
  { name: 'Coral',  value: '#E07B5A' },
  { name: 'Violet', value: '#8B5CF6' },
  { name: 'Blue',   value: '#3B82F6' },
  { name: 'Green',  value: '#10B981' },
  { name: 'Pink',   value: '#EC4899' },
  { name: 'Slate',  value: '#64748B' },
];

const BUTTON_SHAPE_IDS = ['pill', 'rounded', 'rectangle'] as const;
const THEME_IDS = [
  { id: 'system', icon: Monitor },
  { id: 'light',  icon: Sun     },
  { id: 'dark',   icon: Moon    },
] as const;

function notifyPreview() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
}

export function AppearanceSection({ initial }: Props) {
  const t = useSettingsT().appearance;
  const [brandColor,  setBrandColor]  = useState(initial.brandColor);
  const [buttonShape, setButtonShape] = useState(initial.buttonShape);
  const [theme,       setTheme]       = useState(initial.theme);
  const [isPending,   startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateAppearanceAction({ brandColor, buttonShape, theme });
      if (result.error) {
        toast.error(result.error.message);
      } else {
        toast.success(t.successSave);
        notifyPreview();
      }
    });
  };

  return (
    <section id="appearance" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest mb-6">
        {t.sectionTitle}
      </h2>

      {/* Color Swatches */}
      <div className="mb-8">
        <p className="text-sm font-medium text-stone-700 mb-3">{t.brandColor}</p>
        <div className="flex items-center gap-3 flex-wrap mb-3">
          {PRESET_COLORS.map((color) => (
            <button
              key={color.value}
              onClick={() => setBrandColor(color.value)}
              className="relative group"
              aria-label={`Select ${color.name} color`}
            >
              <div
                className="w-8 h-8 rounded-full border-2 transition-all cursor-pointer hover:scale-110"
                style={{ backgroundColor: color.value, borderColor: brandColor === color.value ? '#1C1917' : '#E7E5E4' }}
              />
              {brandColor === color.value && (
                <Check size={16} className="absolute inset-0 m-auto text-white drop-shadow-lg" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-stone-500">{t.custom}</label>
          <input
            type="color"
            value={brandColor}
            onChange={(e) => setBrandColor(e.target.value)}
            className="w-10 h-8 rounded cursor-pointer border border-stone-200"
          />
          <span className="text-xs text-stone-400 font-mono">{brandColor}</span>
        </div>
      </div>

      {/* Button Shapes */}
      <div className="mb-8">
        <p className="text-sm font-medium text-stone-700 mb-3">{t.buttonShape}</p>
        <div className="flex items-center gap-3">
          {BUTTON_SHAPE_IDS.map((id, idx) => (
            <button
              key={id}
              onClick={() => setButtonShape(id)}
              className={`px-4 py-2 text-sm font-medium transition-all ${
                buttonShape === id ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
              style={{ borderRadius: id === 'pill' ? '999px' : id === 'rounded' ? '12px' : '4px' }}
            >
              {t.shapes[idx]}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Selection */}
      <div className="mb-8">
        <p className="text-sm font-medium text-stone-700 mb-3">{t.theme}</p>
        <div className="grid grid-cols-3 gap-3">
          {THEME_IDS.map(({ id, icon: Icon }, idx) => {
            const isSelected = theme === id;
            return (
              <button
                key={id}
                onClick={() => setTheme(id)}
                className={`flex flex-col items-center gap-2 px-4 py-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-stone-800 bg-stone-900 text-white'
                    : 'border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300'
                }`}
              >
                <Icon size={18} />
                <span className="text-xs font-medium">{t.themes[idx]}</span>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
      >
        {isPending && <Loader2 size={16} className="animate-spin" />}
        {t.save}
      </button>
    </section>
  );
}
