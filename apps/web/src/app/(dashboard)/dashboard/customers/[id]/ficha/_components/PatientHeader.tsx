/**
 * PatientHeader — static Server Component.
 * Renders the patient identity card: avatar, contact, registration date,
 * plus RevealField wrappers for encrypted clinical data.
 */

import { ArrowLeft, Mail, Phone, CalendarDays, User } from 'lucide-react';
import Link from 'next/link';
import { RevealField } from './RevealField';

export type PatientHeaderData = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  isGuest: boolean;
  createdAtIso: string;
  onboarding: {
    allergies: string | null;
    medications: string | null;
    chronicConditions: string | null;
  } | null;
};

function AvatarBlock({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).map(p => p[0]!).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-16 h-16 rounded-sm bg-[#F5F0E8] flex items-center justify-center flex-shrink-0">
      <span className="font-serif text-2xl font-light text-[#8B7355]">{initials}</span>
    </div>
  );
}

function MetaItem({ icon: Icon, value, label }: { icon: typeof Mail; value: string | null; label: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-[var(--color-spa-muted)]">
      <Icon size={13} strokeWidth={1.5} className="flex-shrink-0" />
      <span className="font-sans text-sm">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

interface Props { patient: PatientHeaderData; locale: string }

export function PatientHeader({ patient, locale }: Props) {
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';
  const registeredLabel = new Date(patient.createdAtIso).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
  const hasEncryptedData = patient.onboarding && (
    patient.onboarding.allergies || patient.onboarding.medications || patient.onboarding.chronicConditions
  );

  return (
    <div className="space-y-4">
      {/* Back link → CRM profile */}
      <Link
        href={`/dashboard/customers/${patient.id}`}
        className="inline-flex items-center gap-1.5 font-sans text-xs text-[var(--color-spa-muted)] hover:text-[var(--color-spa-stone)] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        {locale === 'en' ? 'Back to profile' : locale === 'pt' ? 'Voltar ao perfil' : 'Volver al perfil'}
      </Link>

      {/* Identity card */}
      <div className="rounded-sm border border-[var(--color-spa-border)] bg-white/60 backdrop-blur-md p-6 space-y-5">
        {/* Avatar + name */}
        <div className="flex items-start gap-4">
          <AvatarBlock name={patient.fullName} />
          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="font-serif text-2xl font-light text-[var(--color-spa-stone)] leading-tight">
              {patient.fullName}
            </h1>
            {patient.isGuest && (
              <span className="inline-flex font-sans text-[9px] uppercase tracking-widest px-2 py-0.5 border border-stone-300 text-[var(--color-spa-muted)] rounded-sm">
                {locale === 'en' ? 'Guest' : locale === 'pt' ? 'Convidado' : 'Invitado'}
              </span>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4">
          <MetaItem icon={Mail}         value={patient.email}  label="Email" />
          <MetaItem icon={Phone}        value={patient.phone}  label="Teléfono" />
          <MetaItem icon={CalendarDays} value={`Alta: ${registeredLabel}`} label="Fecha de alta" />
        </div>

        {/* Encrypted clinical fields */}
        {hasEncryptedData && (
          <div className="pt-4 border-t border-[var(--color-spa-border)]">
            <div className="flex items-center gap-1.5 mb-3">
              <User size={11} strokeWidth={1.5} className="text-[var(--color-spa-muted)]" />
              <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-[var(--color-spa-muted)]">
                Datos de Salud Protegidos
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RevealField value={patient.onboarding!.allergies}          label="Alergias"            variant="danger" />
              <RevealField value={patient.onboarding!.medications}        label="Medicación activa"   variant="danger" />
              <RevealField value={patient.onboarding!.chronicConditions}  label="Condiciones crónicas" variant="danger" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
