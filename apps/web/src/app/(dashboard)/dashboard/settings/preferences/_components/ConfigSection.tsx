'use client';

import { useState, useTransition, useRef } from 'react';
import * as Switch                         from '@radix-ui/react-switch';
import { Loader2, Trash2, Plus }           from 'lucide-react';
import { toast }                           from 'sonner';
import { useTranslations }                 from 'next-intl';
import { updateConfigAction }              from '../actions';
import { AccordionSection }                from './AccordionSection';

function makeId(prefix = 'f') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

interface CustomField { id: string; label: string; required: boolean; }

interface Props {
  initial: {
    firstAvailableSlot:      boolean;
    skipTeamMember:          boolean;
    allowMultipleServices:   boolean;
    anyTeamMemberAllowed:    boolean;
    clientLoginEnabled:      boolean;
    clientLoginRequired:     boolean;
    accordionView:           boolean;
    allowOnlineRescheduling: boolean;
    allowOnlineCancellation: boolean;
    showRebookButton:        boolean;
    formFieldName:           boolean;
    formFieldPhone:          boolean;
    formFieldEmail:          boolean;
    formFieldAddress:        boolean;
  };
}

const switchCls = 'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 disabled:opacity-60';
const thumbCls  = 'block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0';

function ToggleRow({ label, hint, checked, onCheckedChange, disabled = false }: {
  label: string; hint?: string; checked: boolean; onCheckedChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-900">{label}</p>
          {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
        </div>
        <Switch.Root checked={checked} onCheckedChange={onCheckedChange} disabled={disabled} className={switchCls}>
          <Switch.Thumb className={thumbCls} />
        </Switch.Root>
      </div>
    </div>
  );
}

export function ConfigSection({ initial }: Props) {
  const t = useTranslations('dashboard.settings.preferences.config');
  const [isPending, startTransition] = useTransition();

  const [firstAvailableSlot,      setFirstAvailableSlot]      = useState(initial.firstAvailableSlot);
  const [skipTeamMember,          setSkipTeamMember]          = useState(initial.skipTeamMember);
  const [allowMultipleServices,   setAllowMultipleServices]   = useState(initial.allowMultipleServices);
  const [anyTeamMemberAllowed,    setAnyTeamMemberAllowed]    = useState(initial.anyTeamMemberAllowed);
  const [clientLoginEnabled,      setClientLoginEnabled]      = useState(initial.clientLoginEnabled);
  const [clientLoginRequired,     setClientLoginRequired]     = useState(initial.clientLoginRequired);
  const [accordionView,           setAccordionView]           = useState(initial.accordionView);
  const [allowOnlineRescheduling, setAllowOnlineRescheduling] = useState(initial.allowOnlineRescheduling);
  const [allowOnlineCancellation, setAllowOnlineCancellation] = useState(initial.allowOnlineCancellation);
  const [showRebookButton,        setShowRebookButton]        = useState(initial.showRebookButton);
  const [formFieldName,    setFormFieldName]    = useState(initial.formFieldName);
  const [formFieldPhone,   setFormFieldPhone]   = useState(initial.formFieldPhone);
  const [formFieldEmail,   setFormFieldEmail]   = useState(initial.formFieldEmail);
  const [formFieldAddress, setFormFieldAddress] = useState(initial.formFieldAddress);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const fieldCounter = useRef(0);

  function addCustomField() {
    fieldCounter.current += 1;
    setCustomFields((prev) => [...prev, { id: makeId(`field_${fieldCounter.current}`), label: '', required: false }]);
  }
  function updateCustomField(id: string, updated: CustomField) { setCustomFields((prev) => prev.map((f) => f.id === id ? updated : f)); }
  function removeCustomField(id: string) { setCustomFields((prev) => prev.filter((f) => f.id !== id)); }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateConfigAction({
        firstAvailableSlot, skipTeamMember, allowMultipleServices, anyTeamMemberAllowed,
        clientLoginEnabled, clientLoginRequired, accordionView,
        allowOnlineRescheduling, allowOnlineCancellation, showRebookButton,
        formFieldName, formFieldPhone, formFieldEmail, formFieldAddress,
      });
      if (result.error) { toast.error(result.error.message ?? t('errorSave')); }
      else              { toast.success(t('successSave')); }
    });
  };

  const contactFields = [
    { label: t('fieldName'),    key: 'name',    checked: formFieldName,    set: setFormFieldName    },
    { label: t('fieldPhone'),   key: 'phone',   checked: formFieldPhone,   set: setFormFieldPhone   },
    { label: t('fieldEmail'),   key: 'email',   checked: formFieldEmail,   set: setFormFieldEmail   },
    { label: t('fieldAddress'), key: 'address', checked: formFieldAddress, set: setFormFieldAddress },
  ] as const;

  return (
    <AccordionSection id="config" title={t('accordionTitle')}>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">

        {/* Booking flow */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t('flowTitle')}</h3>
          <div className="space-y-0">
            <ToggleRow label={t('firstSlotTitle')}     hint={t('firstSlotHint')}     checked={firstAvailableSlot}      onCheckedChange={setFirstAvailableSlot} />
            <ToggleRow label={t('skipTeamTitle')}      hint={t('skipTeamHint')}      checked={skipTeamMember}          onCheckedChange={setSkipTeamMember} />
            <ToggleRow label={t('multiServicesTitle')} hint={t('multiServicesHint')} checked={allowMultipleServices}   onCheckedChange={setAllowMultipleServices} />
            <ToggleRow label={t('anyMemberTitle')}     hint={t('anyMemberHint')}     checked={anyTeamMemberAllowed}    onCheckedChange={setAnyTeamMemberAllowed} />

            <div className="pb-4 border-b border-stone-50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{t('clientLoginTitle')}</p>
                  <p className="text-xs text-stone-500 mt-1">{t('clientLoginHint')}</p>
                </div>
                <Switch.Root checked={clientLoginEnabled} onCheckedChange={setClientLoginEnabled} className={switchCls}>
                  <Switch.Thumb className={thumbCls} />
                </Switch.Root>
              </div>
              {clientLoginEnabled && (
                <div className="mt-4 ml-8 pt-4 border-t border-stone-50">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-stone-900">{t('required')}</p>
                    <Switch.Root checked={clientLoginRequired} onCheckedChange={setClientLoginRequired} className={switchCls}>
                      <Switch.Thumb className={thumbCls} />
                    </Switch.Root>
                  </div>
                </div>
              )}
            </div>

            <ToggleRow label={t('accordionViewTitle')} hint={t('accordionViewHint')} checked={accordionView}           onCheckedChange={setAccordionView} />
            <ToggleRow label={t('reschedulingTitle')}  hint={t('reschedulingHint')}  checked={allowOnlineRescheduling} onCheckedChange={setAllowOnlineRescheduling} />
            <ToggleRow label={t('cancellationTitle')}  hint={t('cancellationHint')}  checked={allowOnlineCancellation} onCheckedChange={setAllowOnlineCancellation} />
            <ToggleRow label={t('rebookBtnTitle')}     hint={t('rebookBtnHint')}     checked={showRebookButton}        onCheckedChange={setShowRebookButton} />
          </div>
        </div>

        {/* Contact fields */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t('contactFieldsTitle')}</h3>
          <div className="space-y-0">
            {contactFields.map(({ label, key, checked, set }) => (
              <div key={key} className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-stone-900">{label}</p>
                    {checked
                      ? <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-stone-100 text-stone-500">{t('requiredBadge')}</span>
                      : <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-stone-50 text-stone-400">{t('optionalBadge')}</span>}
                  </div>
                  <Switch.Root checked={checked} onCheckedChange={set} className={switchCls}>
                    <Switch.Thumb className={thumbCls} />
                  </Switch.Root>
                </div>
              </div>
            ))}
          </div>

          {customFields.length > 0 && (
            <div className="mt-4 space-y-0 border-t border-stone-50 pt-4">
              <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-3">{t('customFieldsTitle')}</p>
              {customFields.map((field) => (
                <div key={field.id} className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
                  <div className="flex items-center gap-3">
                    <input type="text" value={field.label} onChange={(e) => updateCustomField(field.id, { ...field, label: e.target.value })}
                      placeholder={t('fieldPlaceholder')}
                      className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-300 transition-colors" />
                    <button type="button" onClick={() => updateCustomField(field.id, { ...field, required: !field.required })}
                      className={`text-[10px] rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer select-none ${field.required ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
                      {field.required ? t('requiredBadge') : t('optionalBadge')}
                    </button>
                    <button type="button" onClick={() => removeCustomField(field.id)} title={t('deleteFieldTitle')}
                      className="p-1 text-stone-400 hover:text-rose-500 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4">
            <button type="button" onClick={addCustomField}
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 transition-colors">
              <Plus size={13} />{t('addField')}
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-stone-100">
          <button type="button" onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t('saving') : t('save')}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
