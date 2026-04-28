'use client';

import { useState, useTransition, useRef } from 'react';
import * as Switch                         from '@radix-ui/react-switch';
import { Loader2, Trash2, Plus }           from 'lucide-react';
import { toast }                           from 'sonner';
import { updateConfigAction }              from '../actions';
import { AccordionSection }                from './AccordionSection';

/** ID único sin depender de crypto.randomUUID (no disponible en todos los entornos) */
function makeId(prefix = 'f') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ── Types ─────────────────────────────────────────────────────
interface CustomField {
  id:       string;
  label:    string;
  required: boolean;
}

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

// ── Switch component ──────────────────────────────────────────
const switchCls =
  'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-stone-200 transition-colors data-[state=checked]:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-400 disabled:opacity-60';
const thumbCls =
  'block h-4 w-4 rounded-full bg-white shadow-sm transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0';

// ── ToggleRow ─────────────────────────────────────────────────
function ToggleRow({
  label,
  hint,
  checked,
  onCheckedChange,
  disabled = false,
}: {
  label:           string;
  hint?:           string;
  checked:         boolean;
  onCheckedChange: (v: boolean) => void;
  disabled?:       boolean;
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm font-medium text-stone-900">{label}</p>
          {hint && <p className="text-xs text-stone-500 mt-1">{hint}</p>}
        </div>
        <Switch.Root
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          className={switchCls}
        >
          <Switch.Thumb className={thumbCls} />
        </Switch.Root>
      </div>
    </div>
  );
}

// ── FieldStatusBadge — dinámico Obligatorio / Opcional ────────
function FieldStatusBadge({ required }: { required: boolean }) {
  return required ? (
    <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-stone-100 text-stone-500">
      Obligatorio
    </span>
  ) : (
    <span className="text-[10px] rounded px-1.5 py-0.5 font-medium bg-stone-50 text-stone-400">
      Opcional
    </span>
  );
}

// ── ContactFieldRow — fila sistema (nombre, teléfono, email, dirección) ──
function ContactFieldRow({
  label,
  checked,
  onCheckedChange,
}: {
  label:           string;
  checked:         boolean;
  onCheckedChange: (v: boolean) => void;
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-stone-900">{label}</p>
          <FieldStatusBadge required={checked} />
        </div>
        <Switch.Root
          checked={checked}
          onCheckedChange={onCheckedChange}
          className={switchCls}
        >
          <Switch.Thumb className={thumbCls} />
        </Switch.Root>
      </div>
    </div>
  );
}

// ── CustomFieldRow — campo personalizado ──────────────────────
function CustomFieldRow({
  field,
  onChange,
  onRemove,
}: {
  field:    CustomField;
  onChange: (updated: CustomField) => void;
  onRemove: () => void;
}) {
  return (
    <div className="pb-4 border-b border-stone-50 last:pb-0 last:border-b-0">
      <div className="flex items-center gap-3">
        {/* Name input */}
        <input
          type="text"
          value={field.label}
          onChange={(e) => onChange({ ...field, label: e.target.value })}
          placeholder="Nombre del campo…"
          className="flex-1 border border-stone-200 rounded-lg px-2.5 py-1.5 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-amber-300 transition-colors"
        />

        {/* Required toggle pill */}
        <button
          type="button"
          onClick={() => onChange({ ...field, required: !field.required })}
          className={`
            text-[10px] rounded-full px-2.5 py-1 font-medium transition-colors cursor-pointer select-none
            ${field.required
              ? 'bg-stone-900 text-white'
              : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}
          `}
        >
          {field.required ? 'Obligatorio' : 'Opcional'}
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={onRemove}
          className="p-1 text-stone-400 hover:text-rose-500 transition-colors"
          title="Eliminar campo"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────
export function ConfigSection({ initial }: Props) {
  const [isPending, startTransition] = useTransition();

  // Booking flow
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

  // System contact fields
  const [formFieldName,    setFormFieldName]    = useState(initial.formFieldName);
  const [formFieldPhone,   setFormFieldPhone]   = useState(initial.formFieldPhone);
  const [formFieldEmail,   setFormFieldEmail]   = useState(initial.formFieldEmail);
  const [formFieldAddress, setFormFieldAddress] = useState(initial.formFieldAddress);

  // Custom fields (UI-only — persists after a DB migration adds customFormFields jsonb)
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const fieldCounter = useRef(0);

  // ── Handlers ──────────────────────────────────────────────
  function addCustomField() {
    fieldCounter.current += 1;
    const id = makeId(`field_${fieldCounter.current}`);
    setCustomFields((prev) => [...prev, { id, label: '', required: false }]);
  }

  function updateCustomField(id: string, updated: CustomField) {
    setCustomFields((prev) => prev.map((f) => (f.id === id ? updated : f)));
  }

  function removeCustomField(id: string) {
    setCustomFields((prev) => prev.filter((f) => f.id !== id));
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateConfigAction({
        firstAvailableSlot,
        skipTeamMember,
        allowMultipleServices,
        anyTeamMemberAllowed,
        clientLoginEnabled,
        clientLoginRequired,
        accordionView,
        allowOnlineRescheduling,
        allowOnlineCancellation,
        showRebookButton,
        formFieldName,
        formFieldPhone,
        formFieldEmail,
        formFieldAddress,
      });

      if (result.error) {
        toast.error(result.error.message ?? 'Erro ao guardar configuração');
      } else {
        toast.success('Configuração guardada com sucesso');
      }
    });
  };

  return (
    <AccordionSection id="config" title="Configuração de agendamento">
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-8">

        {/* ── Fluxo de Reservas ──────────────────────────────── */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">Fluxo de Reservas</h3>
          <div className="space-y-0">
            <ToggleRow
              label="Primeira Marcação Disponível"
              hint="Dirige a los clientes a su primer horario disponible."
              checked={firstAvailableSlot}
              onCheckedChange={setFirstAvailableSlot}
            />
            <ToggleRow
              label="Saltar membros da equipa"
              hint="Su cliente selecciona una franja horaria y se le asigna automáticamente un miembro del equipo."
              checked={skipTeamMember}
              onCheckedChange={setSkipTeamMember}
            />
            <ToggleRow
              label="Prestar Serviços Múltiplos"
              hint="Permite reservar vários serviços de uma vez"
              checked={allowMultipleServices}
              onCheckedChange={setAllowMultipleServices}
            />
            <ToggleRow
              label="Qualquer membro da equipa"
              hint="Permita que clientes evitem selecionar um membro da equipe durante o agendamento"
              checked={anyTeamMemberAllowed}
              onCheckedChange={setAnyTeamMemberAllowed}
            />

            {/* Login de Cliente */}
            <div className="pb-4 border-b border-stone-50">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-900">Login de Cliente</p>
                  <p className="text-xs text-stone-500 mt-1">Requer que os clientes façam login</p>
                </div>
                <Switch.Root
                  checked={clientLoginEnabled}
                  onCheckedChange={setClientLoginEnabled}
                  className={switchCls}
                >
                  <Switch.Thumb className={thumbCls} />
                </Switch.Root>
              </div>
              {clientLoginEnabled && (
                <div className="mt-4 ml-8 pt-4 border-t border-stone-50">
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-medium text-stone-900">Obrigatório</p>
                    <Switch.Root
                      checked={clientLoginRequired}
                      onCheckedChange={setClientLoginRequired}
                      className={switchCls}
                    >
                      <Switch.Thumb className={thumbCls} />
                    </Switch.Root>
                  </div>
                </div>
              )}
            </div>

            <ToggleRow
              label="Vista Accordion"
              hint="Mostra os passos em forma de accordeon"
              checked={accordionView}
              onCheckedChange={setAccordionView}
            />
            <ToggleRow
              label="Permitir o reagendamento online"
              hint="Clientes podem remarcar pelo link da reserva"
              checked={allowOnlineRescheduling}
              onCheckedChange={setAllowOnlineRescheduling}
            />
            <ToggleRow
              label="Permitir cancelamentos online"
              hint="Clientes podem cancelar pelo link da reserva"
              checked={allowOnlineCancellation}
              onCheckedChange={setAllowOnlineCancellation}
            />
            <ToggleRow
              label="Botão 'Fazer nova marcação'"
              hint="Mostrar botão após a confirmação"
              checked={showRebookButton}
              onCheckedChange={setShowRebookButton}
            />
          </div>
        </div>

        {/* ── Campos de contato ──────────────────────────────── */}
        <div>
          <h3 className="text-xs text-stone-400 font-medium mb-4">Campos de contato</h3>

          {/* Campos del sistema */}
          <div className="space-y-0">
            <ContactFieldRow label="Nome"      checked={formFieldName}    onCheckedChange={setFormFieldName}    />
            <ContactFieldRow label="Telefone"  checked={formFieldPhone}   onCheckedChange={setFormFieldPhone}   />
            <ContactFieldRow label="E-mail"    checked={formFieldEmail}   onCheckedChange={setFormFieldEmail}   />
            <ContactFieldRow label="Endereço"  checked={formFieldAddress} onCheckedChange={setFormFieldAddress} />
          </div>

          {/* Campos personalizados */}
          {customFields.length > 0 && (
            <div className="mt-4 space-y-0 border-t border-stone-50 pt-4">
              <p className="text-[10px] font-medium text-stone-400 uppercase tracking-widest mb-3">
                Campos personalizados
              </p>
              {customFields.map((field) => (
                <CustomFieldRow
                  key={field.id}
                  field={field}
                  onChange={(updated) => updateCustomField(field.id, updated)}
                  onRemove={() => removeCustomField(field.id)}
                />
              ))}
            </div>
          )}

          {/* Botón añadir */}
          <div className="pt-4">
            <button
              type="button"
              onClick={addCustomField}
              className="inline-flex items-center gap-1.5 text-xs text-amber-700 hover:text-amber-800 transition-colors"
            >
              <Plus size={13} />
              Adicionar campo personalizado
            </button>
          </div>
        </div>

        {/* ── Save ──────────────────────────────────────────── */}
        <div className="pt-4 flex justify-end border-t border-stone-100">
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </AccordionSection>
  );
}
