'use client';

import { useState, useTransition } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { updateVisibilityAction } from '../actions';
import { AccordionSection } from './AccordionSection';

interface Props { initial: { showInSearchResults: boolean }; }

export function VisibilitySection({ initial }: Props) {
  const t = useTranslations('dashboard.settings.preferences.visibility');
  const [isPending, startTransition] = useTransition();
  const [showInSearchResults, setShowInSearchResults] = useState(initial.showInSearchResults);

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateVisibilityAction({ showInSearchResults });
      if (result.error) { toast.error(result.error.message || t('errorSave')); }
      else              { toast.success(t('successSave')); }
    });
  };

  return (
    <AccordionSection id="visibilidade" title={t('accordionTitle')}>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-2">{t('searchResultsTitle')}</h3>
          <p className="text-xs text-stone-500 mb-4">{t('searchResultsDesc')}</p>
          <div className="pb-4 border-b border-stone-50">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-stone-900">{t('showInSearch')}</p>
              <Switch.Root checked={showInSearchResults} onCheckedChange={setShowInSearchResults}
                className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400">
                <Switch.Thumb className="block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0" />
              </Switch.Root>
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-stone-100">
          <button onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
