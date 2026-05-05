'use client';

import { useState, useTransition } from 'react';
import * as Switch from '@radix-ui/react-switch';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { updatePersonalizationAction } from '../actions';
import { AccordionSection }            from './AccordionSection';
import { useSettingsT }                from '../../_i18n';

interface Props {
  initial: {
    preferredLanguage:   string;
    timeFormat:          string;
    weekStartDay:        number;
    showServicePrices:   boolean;
    showServiceDuration: boolean;
    showWorkingHours:    boolean;
    showLocalTime:       boolean;
    termsLabel:          string | null;
    termsUrl:            string | null;
    termsRequired:       boolean;
    redirectLabel:       string | null;
    redirectUrl:         string | null;
  };
}

const switchCls = 'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';
const thumbCls  = 'block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0';

function ToggleRow({ label, checked, onCheckedChange }: {
  label: string; checked: boolean; onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-stone-900">{label}</p>
        <Switch.Root checked={checked} onCheckedChange={onCheckedChange} className={switchCls}>
          <Switch.Thumb className={thumbCls} />
        </Switch.Root>
      </div>
    </div>
  );
}

export function PersonalizationSection({ initial }: Props) {
  const t = useSettingsT().personalization;
  const [isPending, startTransition] = useTransition();

  const [preferredLanguage,   setPreferredLanguage]   = useState(initial.preferredLanguage);
  const [timeFormat,          setTimeFormat]           = useState(initial.timeFormat);
  const [weekStartDay,        setWeekStartDay]         = useState(initial.weekStartDay);
  const [showServicePrices,   setShowServicePrices]    = useState(initial.showServicePrices);
  const [showServiceDuration, setShowServiceDuration]  = useState(initial.showServiceDuration);
  const [showWorkingHours,    setShowWorkingHours]     = useState(initial.showWorkingHours);
  const [showLocalTime,       setShowLocalTime]        = useState(initial.showLocalTime);
  const [termsLabel,          setTermsLabel]           = useState(initial.termsLabel   || '');
  const [termsUrl,            setTermsUrl]             = useState(initial.termsUrl     || '');
  const [termsRequired,       setTermsRequired]        = useState(initial.termsRequired);
  const [redirectLabel,       setRedirectLabel]        = useState(initial.redirectLabel || '');
  const [redirectUrl,         setRedirectUrl]          = useState(initial.redirectUrl   || '');

  const handleSave = () => {
    startTransition(async () => {
      const result = await updatePersonalizationAction({
        preferredLanguage, timeFormat, weekStartDay,
        showServicePrices, showServiceDuration, showWorkingHours, showLocalTime,
        termsLabel: termsLabel || null, termsUrl: termsUrl || null, termsRequired,
        redirectLabel: redirectLabel || null, redirectUrl: redirectUrl || null,
      });
      if (result.error) { toast.error(result.error.message || t.errorSave); }
      else              { toast.success(t.successSave); }
    });
  };

  const selectCls = 'border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:border-amber-300 transition-colors appearance-none w-full';
  const inputCls  = 'border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-800 bg-white focus:outline-none focus:border-amber-300 transition-colors w-full';

  return (
    <AccordionSection id="personalizacao" title={t.accordionTitle}>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">

        {/* General */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t.generalTitle}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.preferredLang}</label>
              <select value={preferredLanguage} onChange={(e) => setPreferredLanguage(e.target.value)} className={selectCls}>
                <option value="pt">Português</option>
                <option value="es">Español</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.timeFormat}</label>
              <select value={timeFormat} onChange={(e) => setTimeFormat(e.target.value)} className={selectCls}>
                <option value="12h">{t.timeFormat12}</option>
                <option value="24h">{t.timeFormat24}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.weekStart}</label>
              <select value={weekStartDay} onChange={(e) => setWeekStartDay(parseInt(e.target.value, 10))} className={selectCls}>
                <option value="1">{t.weekStartMon}</option>
                <option value="0">{t.weekStartSun}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Services */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t.servicesTitle}</h3>
          <div className="space-y-0">
            <ToggleRow label={t.showPrices}       checked={showServicePrices}   onCheckedChange={setShowServicePrices} />
            <ToggleRow label={t.showDuration}     checked={showServiceDuration} onCheckedChange={setShowServiceDuration} />
            <ToggleRow label={t.showWorkingHours} checked={showWorkingHours}    onCheckedChange={setShowWorkingHours} />
            <ToggleRow label={t.showLocalTime}    checked={showLocalTime}       onCheckedChange={setShowLocalTime} />
          </div>
        </div>

        {/* Terms */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t.termsTitle}</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.termsLabel}</label>
              <input type="text" value={termsLabel} onChange={(e) => setTermsLabel(e.target.value)}
                placeholder={t.termsLabelPlaceholder} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.termsLink}</label>
              <input type="text" value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)}
                placeholder="https://..." className={inputCls} />
            </div>
          </div>
          <div className="pb-4 border-b border-stone-50">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-stone-900">{t.requireAcceptance}</p>
              <Switch.Root checked={termsRequired} onCheckedChange={setTermsRequired} className={switchCls}>
                <Switch.Thumb className={thumbCls} />
              </Switch.Root>
            </div>
          </div>
        </div>

        {/* Redirect */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t.redirectTitle}</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.redirectLabel}</label>
              <input type="text" value={redirectLabel} onChange={(e) => setRedirectLabel(e.target.value)}
                placeholder={t.redirectLabelPlaceholder} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-900 mb-2">{t.redirectLink}</label>
              <input type="text" value={redirectUrl} onChange={(e) => setRedirectUrl(e.target.value)}
                placeholder="https://..." className={inputCls} />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-stone-100">
          <button onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t.saving : t.save}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
