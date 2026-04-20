'use client';

import { useRef, useState, useTransition } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import * as Select from '@radix-ui/react-select';
import Image        from 'next/image';
import { X, Camera, ChevronDown, Check } from 'lucide-react';
import { Country, State } from 'country-state-city';
import { toast }    from 'sonner';
import { AddFieldMenu, type FieldType } from './AddFieldMenu';
import { createCustomerAction }  from '../actions/create-customer';
import { updateCustomerAction }  from '../actions/update-customer';
import { uploadAvatarAction }    from '../actions/upload-avatar';

// ── i18n ────────────────────────────────────────────────────────
const L = {
  es: { addTitle: 'Nuevo cliente', editTitle: 'Editar cliente', save: 'Guardar', saving: 'Guardando…', cancel: 'Cancelar', profile: 'Perfil', mainDetails: 'Detalles principales', address: 'Dirección', fullName: 'Nombre completo', phone: 'Teléfono primario', email: 'Email principal', company: 'Empresa (opcional)', country: 'País', selectCountry: 'Seleccionar país', street: 'Dirección (calle, piso)', city: 'Ciudad', state: 'Estado / Provincia', selectState: 'Seleccionar provincia', postal: 'Código postal', successAdd: 'Cliente creado', successEdit: 'Cliente actualizado' },
  pt: { addTitle: 'Novo cliente',   editTitle: 'Editar cliente', save: 'Guardar', saving: 'Guardando…', cancel: 'Cancelar', profile: 'Perfil', mainDetails: 'Detalhes principais', address: 'Endereço', fullName: 'Nome completo', phone: 'Telefone primário', email: 'Email principal', company: 'Empresa (opcional)', country: 'País', selectCountry: 'Selecionar país', street: 'Endereço (rua, apt)', city: 'Cidade', state: 'Estado / Província', selectState: 'Selecionar estado', postal: 'Código postal', successAdd: 'Cliente criado', successEdit: 'Cliente atualizado' },
  en: { addTitle: 'New client',     editTitle: 'Edit client',   save: 'Save',    saving: 'Saving…',     cancel: 'Cancel',   profile: 'Profile', mainDetails: 'Main details',      address: 'Address',   fullName: 'Full name',     phone: 'Primary phone',   email: 'Primary email', company: 'Company (optional)', country: 'Country', selectCountry: 'Select country', street: 'Address (street, apt)', city: 'City', state: 'State / Province', selectState: 'Select state', postal: 'Postal code', successAdd: 'Client created', successEdit: 'Client updated' },
};

// ── Avatar palette ───────────────────────────────────────────────
const PALETTES = [
  { bg: '#F5F0E8', fg: '#8B7355' }, { bg: '#EFF6FF', fg: '#3B82F6' },
  { bg: '#F0FDF4', fg: '#15803D' }, { bg: '#FFF7ED', fg: '#C2410C' },
  { bg: '#FDF4FF', fg: '#9333EA' }, { bg: '#F0FDFA', fg: '#0F766E' },
];
function avatarPalette(name: string) {
  let h = 0; for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return PALETTES[Math.abs(h) % PALETTES.length]!;
}
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() ?? '').join('') || '?'; }

// ── Phone dial codes (for country-code selector only) ────────────
const DIAL_CODES = [
  { iso: 'PT', code: '+351', label: '🇵🇹 +351' },
  { iso: 'ES', code: '+34',  label: '🇪🇸 +34'  },
  { iso: 'BR', code: '+55',  label: '🇧🇷 +55'  },
  { iso: 'US', code: '+1',   label: '🇺🇸 +1'   },
  { iso: 'GB', code: '+44',  label: '🇬🇧 +44'  },
  { iso: 'MX', code: '+52',  label: '🇲🇽 +52'  },
  { iso: 'AR', code: '+54',  label: '🇦🇷 +54'  },
  { iso: 'CO', code: '+57',  label: '🇨🇴 +57'  },
  { iso: 'CL', code: '+56',  label: '🇨🇱 +56'  },
  { iso: 'DE', code: '+49',  label: '🇩🇪 +49'  },
  { iso: 'FR', code: '+33',  label: '🇫🇷 +33'  },
  { iso: 'IT', code: '+39',  label: '🇮🇹 +39'  },
];

function defaultDialCode(locale: string) {
  if (locale === 'pt') return '+351';
  if (locale === 'en') return '+1';
  return '+34';
}

// ── Split stored phone into dial code + number ──────────────────
function splitPhone(full: string | null): { dialCode: string; number: string } {
  if (!full) return { dialCode: '', number: '' };
  for (const d of DIAL_CODES.sort((a, b) => b.code.length - a.code.length)) {
    if (full.startsWith(d.code)) {
      return { dialCode: d.code, number: full.slice(d.code.length).trim() };
    }
  }
  // Fallback: no known prefix found, return full string as number
  return { dialCode: '', number: full };
}

// ── Postal code validation by country ───────────────────────────
const POSTAL_PATTERNS: Record<string, { pattern: RegExp; placeholder: string }> = {
  AR: { pattern: /^\d{4}$|^[A-Z]\d{4}[A-Z]{3}$/i, placeholder: 'C1234ABC' },
  US: { pattern: /^\d{5}(-\d{4})?$/, placeholder: '90210' },
  BR: { pattern: /^\d{5}-?\d{3}$/, placeholder: '01310-100' },
  ES: { pattern: /^\d{5}$/, placeholder: '28001' },
  PT: { pattern: /^\d{4}-?\d{3}$/, placeholder: '1000-001' },
  MX: { pattern: /^\d{5}$/, placeholder: '06600' },
  GB: { pattern: /^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i, placeholder: 'SW1A 1AA' },
  DE: { pattern: /^\d{5}$/, placeholder: '10115' },
  FR: { pattern: /^\d{5}$/, placeholder: '75001' },
  IT: { pattern: /^\d{5}$/, placeholder: '00118' },
  CA: { pattern: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i, placeholder: 'K1A 0A9' },
  CO: { pattern: /^\d{6}$/, placeholder: '110111' },
  CL: { pattern: /^\d{7}$/, placeholder: '8320000' },
};

// ── Dynamic extra field ──────────────────────────────────────────
interface ExtraField { id: string; type: FieldType; customLabel: string; value: string }
function makeFieldId() { return `f_${Math.random().toString(36).slice(2, 8)}`; }

function fieldLabel(type: FieldType, customLabel: string) {
  if (type === 'custom') return customLabel || 'Custom';
  const map: Record<FieldType, string> = { instagram: 'Instagram', facebook: 'Facebook', x: 'X', youtube: 'YouTube', linkedin: 'LinkedIn', tiktok: 'TikTok', website: 'Sitio web', custom: 'Custom', phone: 'Teléfono', email: 'Email' };
  return map[type];
}

function buildSocialLinks(fields: ExtraField[]): Record<string, unknown> {
  const counts: Record<string, number> = {};
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const base = f.type === 'custom' ? 'custom' : f.type;
    counts[base] = (counts[base] ?? 0) + 1;
    const key = counts[base] === 1 ? base : `${base}_${counts[base]}`;
    out[key] = f.type === 'custom' ? { label: f.customLabel, value: f.value } : f.value;
  }
  return out;
}

function parseSocialLinks(sl: Record<string, unknown> | null): ExtraField[] {
  if (!sl) return [];
  return Object.entries(sl).map(([key, value]) => {
    const base = key.replace(/_\d+$/, '') as FieldType;
    const type = base === 'custom' ? 'custom' : base;
    if (typeof value === 'object' && value !== null && 'label' in value) {
      const v = value as { label: string; value: string };
      return { id: makeFieldId(), type: 'custom', customLabel: v.label, value: v.value };
    }
    return { id: makeFieldId(), type, customLabel: '', value: String(value ?? '') };
  });
}

// ── Shared form styles ───────────────────────────────────────────
const INPUT = 'w-full px-3 py-2 font-sans text-sm bg-white border border-stone-200 rounded-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors';
const INPUT_ERROR = 'w-full px-3 py-2 font-sans text-sm bg-white border border-red-300 rounded-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-red-400 transition-colors';
const LABEL = 'block font-sans text-[10px] uppercase tracking-wider text-stone-400 mb-1';
const SECTION_TITLE = 'font-sans text-[10px] uppercase tracking-widest text-stone-400 mb-3 mt-1';
const SELECT_TRIGGER = 'w-full flex items-center justify-between px-3 py-2 font-sans text-sm bg-white border border-stone-200 rounded-sm text-stone-800 focus:outline-none focus:border-stone-400 transition-colors data-[placeholder]:text-stone-400 cursor-pointer';
const SELECT_CONTENT = 'z-[200] bg-white border border-stone-200 rounded-sm shadow-lg max-h-56 overflow-y-auto';
const SELECT_ITEM = 'flex items-center gap-2 px-3 py-1.5 font-sans text-sm text-stone-800 cursor-pointer hover:bg-stone-50 focus:bg-stone-50 focus:outline-none data-[highlighted]:bg-stone-50';

// ── Customer shape for edit mode ─────────────────────────────────
export interface CustomerFormData {
  id: string; fullName: string; email: string | null; phone: string | null;
  notes?: string | null; company?: string | null; country?: string | null;
  countryIso?: string | null; address?: string | null; city?: string | null;
  state?: string | null; postalCode?: string | null;
  socialLinks?: Record<string, unknown> | null; avatarUrl?: string | null;
}

type Props =
  | { mode: 'add';  locale: string; open: boolean; onClose: () => void; onSuccess: (newId: string) => void }
  | { mode: 'edit'; locale: string; open: boolean; onClose: () => void; onSuccess: (id: string) => void; customer: CustomerFormData };

export function CustomerFormModal(props: Props) {
  const { mode, locale, open, onClose, onSuccess } = props;
  const customer = mode === 'edit' ? props.customer : null;

  const t = L[locale as keyof typeof L] ?? L.es;
  const title = mode === 'add' ? t.addTitle : t.editTitle;

  // ── Avatar state ────────────────────────────────────────────────
  const fileInputRef    = useRef<HTMLInputElement>(null);
  const [avatarUrl,     setAvatarUrl]     = useState<string | null>(customer?.avatarUrl ?? null);
  const [avatarFile,    setAvatarFile]    = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // ── Phone split ──────────────────────────────────────────────────
  const phoneParts = splitPhone(customer?.phone ?? null);
  const [dialCode,  setDialCode]  = useState(phoneParts.dialCode || defaultDialCode(locale));
  const [phoneNum,  setPhoneNum]  = useState(phoneParts.number);

  // ── Core form state ──────────────────────────────────────────────
  const [fullName,     setFullName]    = useState(customer?.fullName   ?? '');
  const [email,        setEmail]       = useState(customer?.email      ?? '');
  const [company,      setCompany]     = useState(customer?.company    ?? '');
  const [countryIso,   setCountryIso]  = useState(customer?.countryIso ?? '');
  const [address,      setAddress]     = useState(customer?.address    ?? '');
  const [city,         setCity]        = useState(customer?.city       ?? '');
  const [stateVal,     setStateVal]    = useState(customer?.state      ?? '');
  const [postal,       setPostal]      = useState(customer?.postalCode ?? '');
  const [extraFields,  setExtraFields] = useState<ExtraField[]>(() => parseSocialLinks(customer?.socialLinks ?? null));
  const [menuOpen,     setMenuOpen]    = useState(false);
  const [pending,      startSave]      = useTransition();

  // ── Derived data ─────────────────────────────────────────────────
  const pal              = avatarPalette(fullName || 'A');
  const displayAvatarUrl = avatarPreview ?? avatarUrl;
  const allCountries     = Country.getAllCountries();
  const selectedCountry  = countryIso ? Country.getCountryByCode(countryIso) : null;
  const states           = countryIso ? State.getStatesOfCountry(countryIso) : [];
  const postalMeta       = countryIso ? POSTAL_PATTERNS[countryIso] : undefined;
  const postalInvalid    = !!postalMeta && !!postal && !postalMeta.pattern.test(postal);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB'); return; }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
    e.target.value = '';
  }

  function handleCountryChange(iso: string) {
    setCountryIso(iso);
    setStateVal(''); // reset province when country changes
    setPostal('');   // reset postal too (different format)
  }

  function addField(type: FieldType) { setExtraFields(prev => [...prev, { id: makeFieldId(), type, customLabel: '', value: '' }]); }
  function removeField(id: string)   { setExtraFields(prev => prev.filter(f => f.id !== id)); }
  function updateField(id: string, patch: Partial<ExtraField>) { setExtraFields(prev => prev.map(f => f.id === id ? { ...f, ...patch } : f)); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (postalInvalid) { toast.error(`Código postal inválido para ${selectedCountry?.name ?? countryIso}`); return; }

    const phone = phoneNum.trim() ? `${dialCode}${phoneNum.trim()}` : null;
    const countryName = selectedCountry?.name ?? customer?.country ?? '';
    const socialLinks = buildSocialLinks(extraFields);

    startSave(async () => {
      if (mode === 'add') {
        const fd = new FormData();
        fd.set('fullName', fullName);
        if (email)       fd.set('email',      email);
        if (phone)       fd.set('phone',      phone);
        if (company)     fd.set('company',    company);
        if (countryName) fd.set('country',    countryName);
        if (countryIso)  fd.set('countryIso', countryIso);
        if (address)     fd.set('address',    address);
        if (city)        fd.set('city',       city);
        if (stateVal)    fd.set('state',      stateVal);
        if (postal)      fd.set('postalCode', postal);
        fd.set('socialLinks', JSON.stringify(socialLinks));
        if (avatarFile) fd.set('avatar', avatarFile);

        const res = await createCustomerAction(fd);
        if (res.error) { toast.error(res.error.message); return; }
        toast.success(t.successAdd);
        onClose();
        onSuccess(res.data!.id);
      } else {
        const res = await updateCustomerAction({
          id: customer!.id, fullName,
          email:      email || null,
          phone,
          company:    company || null,
          country:    countryName || null,
          countryIso: countryIso || null,
          address:    address || null,
          city:       city || null,
          state:      stateVal || null,
          postalCode: postal || null,
          socialLinks,
        });
        if (res.error) { toast.error(res.error.message); return; }

        if (avatarFile) {
          const fd = new FormData(); fd.append('avatar', avatarFile);
          await uploadAvatarAction(customer!.id, fd);
        }

        toast.success(t.successEdit);
        onClose();
        onSuccess(customer!.id);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(v) => !v && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 duration-200" />
        <Dialog.Content className="fixed z-50 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded-sm shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 shrink-0">
            <Dialog.Title className="font-serif text-xl font-light text-stone-900">{title}</Dialog.Title>
            <Dialog.Close asChild>
              <button className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 transition-colors">
                <X size={16} strokeWidth={1.5} />
              </button>
            </Dialog.Close>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">

            {/* ── Left column ──────────────────────────────────── */}
            <div className="w-44 shrink-0 border-r border-stone-100 bg-stone-50 flex flex-col items-center pt-6 pb-4 px-3 gap-3">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="relative w-20 h-20 rounded-sm flex items-center justify-center overflow-hidden group shrink-0"
                style={{ backgroundColor: pal.bg }} aria-label="Cambiar foto">
                {displayAvatarUrl
                  ? <Image src={displayAvatarUrl} alt={fullName || '?'} fill className="object-cover" sizes="80px" />
                  : <span className="font-serif text-3xl font-light select-none" style={{ color: pal.fg }}>{initials(fullName || 'A')}</span>}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                  <Camera size={18} strokeWidth={1.5} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

              {fullName.trim() && (
                <p className="font-serif text-sm text-stone-700 text-center leading-tight wrap-break-word w-full">{fullName.trim()}</p>
              )}

              <div className="w-full mt-auto">
                <div className="w-full bg-white rounded-sm px-3 py-1.5 text-center font-sans text-[11px] text-stone-700 border border-stone-200">
                  {t.profile}
                </div>
              </div>
            </div>

            {/* ── Right column ─────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5">

              {/* Main details */}
              <section>
                <p className={SECTION_TITLE}>{t.mainDetails}</p>
                <div className="space-y-3">
                  <div>
                    <label className={LABEL}>{t.fullName} *</label>
                    <input value={fullName} onChange={e => setFullName(e.target.value)} required minLength={2} maxLength={120} className={INPUT} />
                  </div>

                  {/* Phone with dial code selector */}
                  <div>
                    <label className={LABEL}>{t.phone}</label>
                    <div className="flex gap-1.5">
                      <div className="relative">
                        <select value={dialCode} onChange={e => setDialCode(e.target.value)}
                          className="appearance-none pl-3 pr-7 py-2 font-sans text-sm bg-white border border-stone-200 rounded-sm text-stone-800 focus:outline-none focus:border-stone-400 transition-colors cursor-pointer">
                          {DIAL_CODES.map(d => <option key={d.iso} value={d.code}>{d.label}</option>)}
                        </select>
                        <ChevronDown size={12} strokeWidth={1.5} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                      </div>
                      <input value={phoneNum} onChange={e => setPhoneNum(e.target.value)} maxLength={20}
                        placeholder="612 345 678" className={`${INPUT} flex-1`} />
                    </div>
                  </div>

                  <div>
                    <label className={LABEL}>{t.email}</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={200} className={INPUT} />
                  </div>

                  <div>
                    <label className={LABEL}>{t.company}</label>
                    <input value={company} onChange={e => setCompany(e.target.value)} maxLength={200} className={INPUT} />
                  </div>
                </div>
              </section>

              {/* Address */}
              <section>
                <p className={SECTION_TITLE}>{t.address}</p>
                <div className="space-y-3">

                  {/* Country — Radix Select with all countries */}
                  <div>
                    <label className={LABEL}>{t.country}</label>
                    <Select.Root value={countryIso} onValueChange={handleCountryChange}>
                      <Select.Trigger className={SELECT_TRIGGER}>
                        <Select.Value placeholder={t.selectCountry}>
                          {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.name}` : undefined}
                        </Select.Value>
                        <Select.Icon><ChevronDown size={14} strokeWidth={1.5} className="text-stone-400" /></Select.Icon>
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className={SELECT_CONTENT} position="popper" sideOffset={4}>
                          <Select.Viewport>
                            {allCountries.map(c => (
                              <Select.Item key={c.isoCode} value={c.isoCode} className={SELECT_ITEM}>
                                <Select.ItemIndicator><Check size={12} className="text-stone-500" /></Select.ItemIndicator>
                                <Select.ItemText>{c.flag} {c.name}</Select.ItemText>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                  </div>

                  <div>
                    <label className={LABEL}>{t.street}</label>
                    <input value={address} onChange={e => setAddress(e.target.value)} maxLength={300} className={INPUT} />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={LABEL}>{t.city}</label>
                      <input value={city} onChange={e => setCity(e.target.value)} maxLength={100} className={INPUT} />
                    </div>
                    <div>
                      <label className={LABEL}>
                        {t.postal}
                        {postalInvalid && <span className="ml-1 text-red-400 normal-case">· formato inválido</span>}
                      </label>
                      <input
                        value={postal}
                        onChange={e => setPostal(e.target.value)}
                        maxLength={20}
                        placeholder={postalMeta?.placeholder ?? ''}
                        className={postalInvalid ? INPUT_ERROR : INPUT}
                      />
                    </div>
                  </div>

                  {/* State/Province — dropdown if country has states, text input otherwise */}
                  <div>
                    <label className={LABEL}>{t.state}</label>
                    {states.length > 0 ? (
                      <Select.Root value={stateVal} onValueChange={setStateVal}>
                        <Select.Trigger className={SELECT_TRIGGER}>
                          <Select.Value placeholder={t.selectState} />
                          <Select.Icon><ChevronDown size={14} strokeWidth={1.5} className="text-stone-400" /></Select.Icon>
                        </Select.Trigger>
                        <Select.Portal>
                          <Select.Content className={SELECT_CONTENT} position="popper" sideOffset={4}>
                            <Select.Viewport>
                              {states.map(s => (
                                <Select.Item key={s.isoCode} value={s.name} className={SELECT_ITEM}>
                                  <Select.ItemIndicator><Check size={12} className="text-stone-500" /></Select.ItemIndicator>
                                  <Select.ItemText>{s.name}</Select.ItemText>
                                </Select.Item>
                              ))}
                            </Select.Viewport>
                          </Select.Content>
                        </Select.Portal>
                      </Select.Root>
                    ) : (
                      <input value={stateVal} onChange={e => setStateVal(e.target.value)} maxLength={100} className={INPUT} />
                    )}
                  </div>
                </div>
              </section>

              {/* Dynamic extra fields */}
              {extraFields.length > 0 && (
                <section className="space-y-2">
                  {extraFields.map((field) => (
                    <div key={field.id} className="space-y-1">
                      {field.type === 'custom' && (
                        <input value={field.customLabel} onChange={e => updateField(field.id, { customLabel: e.target.value })}
                          placeholder="Nombre del campo" maxLength={60} className={`${INPUT} text-[11px] py-1.5`} />
                      )}
                      <div className="flex gap-1.5">
                        <div className="flex-none flex items-center px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-sm">
                          <span className="font-sans text-[10px] text-stone-500 uppercase tracking-wider whitespace-nowrap">
                            {fieldLabel(field.type, field.customLabel)}
                          </span>
                        </div>
                        <input value={field.value} onChange={e => updateField(field.id, { value: e.target.value })}
                          maxLength={300} className={`${INPUT} flex-1`} />
                        <button type="button" onClick={() => removeField(field.id)}
                          className="flex-none p-2 rounded-sm hover:bg-rose-50 text-stone-400 hover:text-rose-500 transition-colors border border-stone-200">
                          <X size={14} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </section>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-stone-100 shrink-0">
            <AddFieldMenu open={menuOpen} onOpenChange={setMenuOpen} onSelect={addField} locale={locale} />
            <div className="flex gap-2">
              <button type="button" onClick={onClose}
                className="px-4 py-2 rounded-sm border border-stone-200 font-sans text-sm text-stone-600 hover:bg-stone-50 transition-colors">
                {t.cancel}
              </button>
              <button type="submit" disabled={pending || !fullName.trim()}
                className="px-4 py-2 rounded-sm bg-stone-900 font-sans text-sm text-white hover:bg-stone-800 disabled:opacity-40 transition-colors">
                {pending ? t.saving : t.save}
              </button>
            </div>
          </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
