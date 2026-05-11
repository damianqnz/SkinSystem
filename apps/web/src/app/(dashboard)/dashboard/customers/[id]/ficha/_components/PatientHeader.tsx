/**
 * PatientHeader — async Server Component.
 * Renders the patient identity card: avatar, contact, registration date,
 * plus RevealField wrappers for encrypted clinical data.
 */

import { ArrowLeft, Mail, Phone, CalendarDays, User } from 'lucide-react';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { RevealField } from './RevealField';

// ── Types ─────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────

function AvatarBlock({ name }: { name: string }) {
  const initials = name.trim().split(/\s+/).map(p => p[0]!).slice(0, 2).join('').toUpperCase();
  return (
    <div className="w-16 h-16 rounded-sm bg-[#F5F0E8] flex items-center justify-center shrink-0">
      <span className="font-serif text-2xl font-light text-[#8B7355]">{initials}</span>
    </div>
  );
}

function MetaItem({ icon: Icon, value, label }: { icon: typeof Mail; value: string | null; label: string }) {
  if (!value) return null;
  return (
    <div className="flex items-center gap-2 text-spa-muted">
      <Icon size={13} strokeWidth={1.5} className="shrink-0" />
      <span className="font-sans text-sm">{value}</span>
      <span className="sr-only">{label}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

interface Props { patient: PatientHeaderData; locale: string }

export async function PatientHeader({ patient, locale }: Props) {
  const t   = await getTranslations({ locale, namespace: 'dashboard.customers.ficha' });
  const tag = locale === 'pt' ? 'pt-PT' : locale === 'en' ? 'en-GB' : 'es-ES';

  const registeredDate  = new Date(patient.createdAtIso).toLocaleDateString(tag, { day: 'numeric', month: 'long', year: 'numeric' });
  const hasEncryptedData = patient.onboarding && (
    patient.onboarding.allergies || patient.onboarding.medications || patient.onboarding.chronicConditions
  );

  return (
    <div className="space-y-4">
      {/* Back link */}
      <Link
        href="/dashboard/clients"
        className="inline-flex items-center gap-1.5 font-sans text-xs text-spa-muted hover:text-(--color-spa-stone) transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        {t('allClientsLink')}
      </Link>

      {/* Identity card */}
      <div className="rounded-sm border border-spa-border bg-white/60 backdrop-blur-md p-6 space-y-5">
        <div className="flex items-start gap-4">
          <AvatarBlock name={patient.fullName} />
          <div className="flex-1 min-w-0 space-y-1">
            <h1 className="font-serif text-2xl font-light text-(--color-spa-stone) leading-tight">
              {patient.fullName}
            </h1>
            {patient.isGuest && (
              <span className="inline-flex font-sans text-[9px] uppercase tracking-widest px-2 py-0.5 border border-stone-300 text-spa-muted rounded-sm">
                {t('guestBadge')}
              </span>
            )}
          </div>
        </div>

        {/* Contact row */}
        <div className="flex flex-wrap gap-4">
          <MetaItem icon={Mail}         value={patient.email}  label="Email" />
          <MetaItem icon={Phone}        value={patient.phone}  label="Phone" />
          <MetaItem icon={CalendarDays} value={t('registeredLabel', { date: registeredDate })} label="Registered" />
        </div>

        {/* Encrypted clinical fields */}
        {hasEncryptedData && (
          <div className="pt-4 border-t border-spa-border">
            <div className="flex items-center gap-1.5 mb-3">
              <User size={11} strokeWidth={1.5} className="text-spa-muted" />
              <p className="font-sans text-[10px] uppercase tracking-[0.15em] text-spa-muted">
                {t('healthDataLabel')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RevealField value={patient.onboarding!.allergies}         label={t('allergyLabel')}    variant="danger" />
              <RevealField value={patient.onboarding!.medications}       label={t('medicationLabel')} variant="danger" />
              <RevealField value={patient.onboarding!.chronicConditions} label={t('conditionsLabel')} variant="danger" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
