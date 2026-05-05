'use client';

import { useState, useTransition, useRef } from 'react';
import * as Switch                         from '@radix-ui/react-switch';
import { Loader2, Trash2, Plus }           from 'lucide-react';
import { toast }                           from 'sonner';
import { updateConfigAction }              from '../actions';
import { AccordionSection }                from './AccordionSection';
import { useSettingsT }                    from '../../_i18n';

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

function FieldStatusBadge({ required, labels }: { required: boolean; labels: { required: string; optional: string } }) {
  return required
    ? <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-stone-100 text-stone-500">{labels.required}</span>
    : <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-stone-50 text-stone-400">{labels.optional}</span>;
}

function ContactFieldRow({ label, checked, onCheckedChange, badgeLabels }: {
  label: string; checked: boolean; onCheckedChange: (v: boolean) => void;
  badgeLabels: { required: string; optional: string };
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-900">{label}</p>
          <FieldStatusBadge required={checked} labels={badgeLabels} />
        </div>
        <Switch.Root checked={checked} onCheckedChange={onCheckedChange} className={switchCls}>
          <Switch.Thumb className={thumbCls} />
        </Switch.Root>
      </div>
    </div>
  );
}

function CustomFieldRow({ field, onChange, onRemove, labels }: {
  field: CustomField; onChange: (updated: CustomField) => void; onRemove: () => void;
  labels: { required: string; optional: string; placeholder: string; deleteTitle: string };
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center gap-3">
        <input type="text" value={field.label} onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder={labels.placeholder}
          className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-300 transition-colors" />
        <button type="button" onClick={() => onChange({ ...field, required: !field.required })}
          className={`text-[10px] rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer select-none ${field.required ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>
          {field.required ? labels.required : labels.optional}
        </button>
        <button type="button" onClick={onRemove} title={labels.deleteTitle}
          className="p-1 text-stone-400 hover:text-rose-500 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

export function ConfigSection({ initial }: Props) {
  const t = useSettingsT().config;
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
      if (result.error) { toast.error(result.error.message ?? t.errorSave); }
      else              { toast.success(t.successSave); }
    });
  };

  const badgeLabels = { required: t.required_badge, optional: t.optional_badge };
  const customFieldLabels = { required: t.required_badge, optional: t.optional_badge, placeholder: t.fieldPlaceholder, deleteTitle: t.deleteFieldTitle };

  return (
    <AccordionSection id="config" title={t.accordionTitle}>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">

        {/* Booking flow */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t.flowTitle}</h3>
          <div className="space-y-0">
            <ToggleRow label={t.firstSlot.title}    hint={t.firstSlot.hint}    checked={firstAvailableSlot}      onCheckedChange={setFirstAvailableSlot} />
            <ToggleRow label={t.skipTeam.title}     hint={t.skipTeam.hint}     checked={skipTeamMember}          onCheckedChange={setSkipTeamMember} />
            <ToggleRow label={t.multiServices.title} hint={t.multiServices.hint} checked={allowMultipleServices} onCheckedChange={setAllowMultipleServices} />
            <ToggleRow label={t.anyMember.title}    hint={t.anyMember.hint}    checked={anyTeamMemberAllowed}    onCheckedChange={setAnyTeamMemberAllowed} />

            <div className="pb-4 border-b border-stone-50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">{t.clientLogin.title}</p>
                  <p className="text-xs text-stone-500 mt-1">{t.clientLogin.hint}</p>
                </div>
                <Switch.Root checked={clientLoginEnabled} onCheckedChange={setClientLoginEnabled} className={switchCls}>
                  <Switch.Thumb className={thumbCls} />
                </Switch.Root>
              </div>
              {clientLoginEnabled && (
                <div className="mt-4 ml-8 pt-4 border-t border-stone-50">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-stone-900">{t.required}</p>
                    <Switch.Root checked={clientLoginRequired} onCheckedChange={setClientLoginRequired} className={switchCls}>
                      <Switch.Thumb className={thumbCls} />
                    </Switch.Root>
                  </div>
                </div>
              )}
            </div>

            <ToggleRow label={t.accordion.title}    hint={t.accordion.hint}    checked={accordionView}           onCheckedChange={setAccordionView} />
            <ToggleRow label={t.rescheduling.title} hint={t.rescheduling.hint} checked={allowOnlineRescheduling} onCheckedChange={setAllowOnlineRescheduling} />
            <ToggleRow label={t.cancellation.title} hint={t.cancellation.hint} checked={allowOnlineCancellation} onCheckedChange={setAllowOnlineCancellation} />
            <ToggleRow label={t.rebookBtn.title}    hint={t.rebookBtn.hint}    checked={showRebookButton}        onCheckedChange={setShowRebookButton} />
          </div>
        </div>

        {/* Contact fields */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">{t.contactFieldsTitle}</h3>
          <div className="space-y-0">
            <ContactFieldRow label={t.fieldName}    checked={formFieldName}    onCheckedChange={setFormFieldName}    badgeLabels={badgeLabels} />
            <ContactFieldRow label={t.fieldPhone}   checked={formFieldPhone}   onCheckedChange={setFormFieldPhone}   badgeLabels={badgeLabels} />
            <ContactFieldRow label={t.fieldEmail}   checked={formFieldEmail}   onCheckedChange={setFormFieldEmail}   badgeLabels={badgeLabels} />
            <ContactFieldRow label={t.fieldAddress} checked={formFieldAddress} onCheckedChange={setFormFieldAddress} badgeLabels={badgeLabels} />
          </div>

          {customFields.length > 0 && (
            <div className="mt-4 space-y-0 border-t border-stone-50 pt-4">
              <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-3">{t.customFieldsTitle}</p>
              {customFields.map((field) => (
                <CustomFieldRow key={field.id} field={field} labels={customFieldLabels}
                  onChange={(updated) => updateCustomField(field.id, updated)}
                  onRemove={() => removeCustomField(field.id)} />
              ))}
            </div>
          )}

          <div className="pt-4">
            <button type="button" onClick={addCustomField}
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 transition-colors">
              <Plus size={13} />{t.addField}
            </button>
          </div>
        </div>

        <div className="pt-4 flex justify-end border-t border-stone-100">
          <button type="button" onClick={handleSave} disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t.saving : t.save}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
