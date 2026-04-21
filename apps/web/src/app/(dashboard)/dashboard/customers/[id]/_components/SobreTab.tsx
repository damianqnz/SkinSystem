'use client';

import { Mail, Phone, Calendar, Building, MapPin, Globe, Link2, Tag } from 'lucide-react';

// ── Social icon + label map ──────────────────────────────────────
const SOCIAL_META: Record<string, { label: string }> = {
  instagram: { label: 'Instagram' }, facebook: { label: 'Facebook' },
  x:         { label: 'X (Twitter)' }, youtube:  { label: 'YouTube' },
  linkedin:  { label: 'LinkedIn' },   tiktok:   { label: 'TikTok' },
  website:   { label: 'Sitio web' },  phone:    { label: 'Teléfono' },
  email:     { label: 'Email' },
};

function SocialIcon({ type }: { type: string }) {
  if (type === 'website') return <Globe size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />;
  if (type === 'phone')   return <Phone size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />;
  if (type === 'email')   return <Mail  size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />;
  if (type === 'custom')  return <Tag   size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />;
  return <Link2 size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />;
}

function fmtDate(iso: string, locale: string) {
  const d = new Date(iso);
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  return d.toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' });
}

interface Props {
  locale:       string;
  email:        string | null;
  phone:        string | null;
  createdAtIso: string;
  company?:     string | null;
  country?:     string | null;
  address?:     string | null;
  city?:        string | null;
  state?:       string | null;
  postalCode?:  string | null;
  notes?:       string | null;
  socialLinks?: Record<string, unknown> | null;
}

export function SobreTab({ locale, email, phone, createdAtIso, company, country, address, city, state, postalCode, notes, socialLinks }: Props) {
  const hasAddress = address || city || state || country || postalCode;
  const socialEntries = socialLinks ? Object.entries(socialLinks) : [];

  const noData = !email && !phone && !company && !hasAddress && socialEntries.length === 0 && !notes;

  return (
    <div className="space-y-3">
      {/* Contact info */}
      {email && (
        <div className="flex items-center gap-3">
          <Mail size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />
          <span className="font-sans text-sm text-stone-700 break-all">{email}</span>
        </div>
      )}
      {phone && (
        <div className="flex items-center gap-3">
          <Phone size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />
          <span className="font-sans text-sm text-stone-700">{phone}</span>
        </div>
      )}

      {/* Company */}
      {company && (
        <div className="flex items-center gap-3">
          <Building size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />
          <span className="font-sans text-sm text-stone-700">{company}</span>
        </div>
      )}

      {/* Address block */}
      {hasAddress && (
        <div className="flex items-start gap-3">
          <MapPin size={13} strokeWidth={1.5} className="text-stone-400 shrink-0 mt-0.5" />
          <div className="font-sans text-sm text-stone-700 space-y-0.5">
            {address && <p>{address}</p>}
            {(city || state || postalCode) && (
              <p>{[city, state, postalCode].filter(Boolean).join(', ')}</p>
            )}
            {country && <p>{country}</p>}
          </div>
        </div>
      )}

      {/* Notes */}
      {notes && (
        <div className="p-3 bg-stone-50 rounded-sm border border-stone-100">
          <p className="font-sans text-sm text-stone-600 leading-relaxed whitespace-pre-wrap">{notes}</p>
        </div>
      )}

      {/* Social / extra links */}
      {socialEntries.length > 0 && (
        <div className="pt-2 border-t border-stone-100 space-y-2.5">
          {socialEntries.map(([key, value]) => {
            const base = key.replace(/_\d+$/, '');
            if (typeof value === 'object' && value !== null && 'label' in value) {
              const { label, value: val } = value as { label: string; value: string };
              return (
                <div key={key} className="flex items-center gap-3">
                  <SocialIcon type="custom" />
                  <span className="font-sans text-[10px] uppercase tracking-wider text-stone-400 w-20 shrink-0">{label}</span>
                  <span className="font-sans text-sm text-stone-700 truncate">{val}</span>
                </div>
              );
            }
            const meta = SOCIAL_META[base];
            const label = meta?.label ?? base;
            return (
              <div key={key} className="flex items-center gap-3">
                <SocialIcon type={base} />
                <span className="font-sans text-[10px] uppercase tracking-wider text-stone-400 w-20 shrink-0">{label}</span>
                <span className="font-sans text-sm text-stone-700 truncate">{String(value ?? '')}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Member since — always shown */}
      <div className={`flex items-center gap-3 ${socialEntries.length > 0 ? '' : 'pt-1'}`}>
        <Calendar size={13} strokeWidth={1.5} className="text-stone-400 shrink-0" />
        <span className="font-sans text-sm text-stone-400">
          {locale === 'en' ? 'Member since' : locale === 'pt' ? 'Desde' : 'Alta'} {fmtDate(createdAtIso, locale)}
        </span>
      </div>

      {/* Empty state */}
      {noData && (
        <p className="font-sans text-sm text-stone-400 italic">
          {locale === 'pt' ? 'Sem dados de contacto.' : locale === 'en' ? 'No contact info.' : 'Sin datos de contacto.'}
        </p>
      )}
    </div>
  );
}
