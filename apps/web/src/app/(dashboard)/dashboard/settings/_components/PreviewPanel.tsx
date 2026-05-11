'use client';

import { useState, useEffect } from 'react';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Props { previewUrl: string; }

export function PreviewPanel({ previewUrl }: Props) {
  const t = useTranslations('dashboard.settings.preview');
  const [device,  setDevice]  = useState<'mobile' | 'desktop'>('mobile');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    function onSaved() { setRefresh((n) => n + 1); }
    window.addEventListener('skinsystem:settings-saved', onSaved);
    return () => window.removeEventListener('skinsystem:settings-saved', onSaved);
  }, []);

  function handleRefresh() {
    setRefresh((n) => n + 1);
  }

  const bust = (base: string) => `${base}${base.includes('?') ? '&' : '?'}_r=${refresh}`;

  return (
    <aside className="hidden xl:flex flex-col w-80 shrink-0 border-l border-stone-100 bg-[#FAFAF9] mr-2 h-full overflow-y-auto">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest">{t('viewLabel')}</p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setDevice('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${device === 'mobile' ? 'bg-stone-200 text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Smartphone size={13} />
          </button>
          <button
            onClick={() => setDevice('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${device === 'desktop' ? 'bg-stone-200 text-stone-800' : 'text-stone-400 hover:text-stone-600'}`}
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-600 transition-colors"
            title={t('refreshTitle')}
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* URL bar */}
      <div className="px-4 py-2 border-b border-stone-100">
        <p className="text-[10px] text-stone-400 font-mono truncate">{previewUrl}</p>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-hidden flex items-start justify-center p-4">
        {device === 'mobile' ? (
          <div className="relative w-[224px]">
            <div className="bg-stone-900 rounded-[28px] p-2 shadow-xl">
              <div className="bg-white rounded-[20px] overflow-hidden" style={{ height: '460px' }}>
                <iframe
                  key={refresh}
                  src={bust(previewUrl)}
                  title="Booking page preview"
                  className="w-full h-full border-0"
                  style={{ transform: 'scale(0.6)', transformOrigin: 'top left', width: '167%', height: '167%' }}
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>
            </div>
            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-stone-800 rounded-full" />
          </div>
        ) : (
          <div className="w-full bg-stone-200 rounded-xl overflow-hidden shadow-md">
            <div className="h-6 flex items-center gap-1.5 px-3 bg-stone-300">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            </div>
            <div className="overflow-hidden" style={{ height: '320px' }}>
              <iframe
                key={refresh + 10}
                src={bust(previewUrl)}
                title="Booking page desktop preview"
                className="w-full h-full border-0"
                style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%', height: '200%' }}
                sandbox="allow-scripts allow-same-origin"
              />
            </div>
          </div>
        )}
      </div>

      {/* Help CTA */}
      <div className="px-4 py-4 border-t border-stone-100">
        <div className="bg-stone-50 rounded-xl p-3 text-center">
          <p className="text-[11px] font-medium text-stone-700 leading-snug">{t('helpHeading')}</p>
          <p className="text-[10px] text-stone-400 mt-0.5 leading-snug">{t('helpBody')}</p>
          <button className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-700 hover:text-amber-800 transition-colors">
            {t('helpCta')}
          </button>
        </div>
      </div>
    </aside>
  );
}
