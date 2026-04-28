'use client';

import { useState }          from 'react';
import Link                  from 'next/link';
import Image                 from 'next/image';
import {
  Star, MapPin, Phone, Mail, Globe,
  ChevronDown, ChevronUp,
} from 'lucide-react';
import type { PublicOrg, OrgPhone, AvailabilityDay, OpenStatus } from '../_data/getLandingData';

// ── Helpers ───────────────────────────────────────────────────

const DAY_NAMES_PT = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function fmtTime(t: string) { const [h, m] = t.split(':'); return `${h}:${m}`; }

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i} size={14}
          className={i <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'text-stone-300 dark:text-stone-600'}
        />
      ))}
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────

interface Props {
  org:                PublicOrg;
  phones:             OrgPhone[];
  availability:       AvailabilityDay[];
  openStatus:         OpenStatus;
  avgRating:          number;
  reviewCount:        number;
  showReserveButton?: boolean;
}

export function StickyInfoCard({ org, phones, availability, openStatus, avgRating, reviewCount, showReserveButton = true }: Props) {
  const [hoursOpen,   setHoursOpen]   = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  const socialLinks = org.socialLinks as Record<string, unknown>;
  const primaryPhone = phones.find(p => p.isPrimary) ?? phones[0];

  const address = [org.address, org.city, org.postalCode].filter(Boolean).join(', ');

  return (
    <div className="bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 rounded-2xl overflow-hidden shadow-sm">

      {/* ── Logo + name ──────────────────────────────────── */}
      <div className="flex flex-col items-center pt-8 pb-5 px-6 border-b border-stone-100 dark:border-stone-800">
        {org.logoUrl ? (
          <Image
            src={org.logoUrl} alt={org.name}
            width={64} height={64}
            className="rounded-full object-cover border-2 border-stone-100 dark:border-stone-700"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-amber-400 flex items-center justify-center border-2 border-amber-300">
            <span className="font-cormorant text-2xl font-semibold text-stone-950">
              {org.name.charAt(0)}
            </span>
          </div>
        )}
        <h2 className="mt-3 font-cormorant text-xl font-semibold text-stone-900 dark:text-stone-100 text-center leading-tight">
          {org.name}
        </h2>
        {reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-2">
            <Stars rating={avgRating} />
            <span className="text-[13px] text-stone-500 dark:text-stone-400">
              {avgRating} · {reviewCount} avaliações
            </span>
          </div>
        )}
      </div>

      {/* ── Actions ──────────────────────────────────────── */}
      <div className="p-4 space-y-2">

        {/* Reserve */}
        {showReserveButton && (
          <Link
            href="/book"
            className="block w-full text-center py-3 text-stone-950 font-outfit text-sm font-semibold hover:opacity-90 transition-opacity shadow-sm"
            style={{ backgroundColor: 'var(--brand-color)', borderRadius: 'var(--btn-radius)' }}
          >
            Reservar
          </Link>
        )}

        {/* Open status */}
        <div className="rounded-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <button
            onClick={() => setHoursOpen(v => !v)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <span className={[
              'w-2 h-2 rounded-full shrink-0',
              openStatus.isOpen ? 'bg-green-500' : 'bg-red-400',
            ].join(' ')} />
            <span className="flex-1 text-left text-[13px] font-outfit text-stone-700 dark:text-stone-300">
              {openStatus.label}
            </span>
            {hoursOpen
              ? <ChevronUp size={14} className="text-stone-400 shrink-0" />
              : <ChevronDown size={14} className="text-stone-400 shrink-0" />
            }
          </button>

          {hoursOpen && (
            <div className="border-t border-stone-100 dark:border-stone-800 px-4 py-3 space-y-1.5">
              {DAY_NAMES_PT.map((dayName, dow) => {
                const rule = availability.find(r => r.dayOfWeek === dow && r.isActive);
                return (
                  <div key={dow} className="flex justify-between text-[12px]">
                    <span className="text-stone-500 dark:text-stone-400">{dayName}</span>
                    <span className="text-stone-700 dark:text-stone-300 font-medium">
                      {rule ? `${fmtTime(rule.openTime)} – ${fmtTime(rule.closeTime)}` : 'Fechado'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Address */}
        {address && (
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors group"
          >
            <MapPin size={15} className="shrink-0 mt-0.5 text-stone-400 group-hover:text-amber-500 transition-colors" />
            <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400 group-hover:text-stone-900 dark:group-hover:text-stone-200 transition-colors leading-snug">
              {address}
            </span>
          </a>
        )}

        {/* Contact */}
        <div className="rounded-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
          <button
            onClick={() => setContactOpen(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
          >
            <span className="text-[13px] font-outfit font-medium text-stone-700 dark:text-stone-300">
              Contactar-nos
            </span>
            {contactOpen
              ? <ChevronUp size={14} className="text-stone-400" />
              : <ChevronDown size={14} className="text-stone-400" />
            }
          </button>

          {contactOpen && (
            <div className="border-t border-stone-100 dark:border-stone-800 divide-y divide-stone-100 dark:divide-stone-800">
              {/* All phones */}
              {phones.map((p, i) => (
                <a
                  key={i}
                  href={`https://wa.me/${p.phone.replace(/\D/g, '')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <Phone size={14} className="text-green-500" />
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">{p.phone}</span>
                </a>
              ))}
              {/* Primary email */}
              {org.primaryEmail && (
                <a
                  href={`mailto:${org.primaryEmail}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <Mail size={14} className="text-blue-500" />
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400 truncate">{org.primaryEmail}</span>
                </a>
              )}
              {/* Additional emails */}
              {(Array.isArray(socialLinks?.additionalEmails) ? socialLinks.additionalEmails as string[] : []).map((email, i) => (
                <a
                  key={`ae${i}`}
                  href={`mailto:${email}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors"
                >
                  <Mail size={14} className="text-blue-400" />
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400 truncate">{email}</span>
                </a>
              ))}
              {typeof socialLinks?.website === 'string' && socialLinks.website && (
                <a href={socialLinks.website as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  <Globe size={14} className="text-stone-400" />
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400 truncate">{(socialLinks.website as string).replace(/^https?:\/\//, '')}</span>
                </a>
              )}
              {typeof socialLinks?.instagram === 'string' && socialLinks.instagram && (
                <a href={socialLinks.instagram as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* Instagram */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-pink-500"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">Instagram</span>
                </a>
              )}
              {typeof socialLinks?.facebook === 'string' && socialLinks.facebook && (
                <a href={socialLinks.facebook as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* Facebook */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-600"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">Facebook</span>
                </a>
              )}
              {typeof socialLinks?.tiktok === 'string' && socialLinks.tiktok && (
                <a href={socialLinks.tiktok as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* TikTok */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-stone-800 dark:text-stone-200"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.75a4.85 4.85 0 0 1-1.01-.06z"/></svg>
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">TikTok</span>
                </a>
              )}
              {typeof socialLinks?.youtube === 'string' && socialLinks.youtube && (
                <a href={socialLinks.youtube as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* YouTube */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-600"><path d="M23.5 6.19a3 3 0 0 0-2.11-2.12C19.55 3.5 12 3.5 12 3.5s-7.55 0-9.39.57A3 3 0 0 0 .5 6.19 31.18 31.18 0 0 0 0 12a31.18 31.18 0 0 0 .5 5.81 3 3 0 0 0 2.11 2.12C4.45 20.5 12 20.5 12 20.5s7.55 0 9.39-.57a3 3 0 0 0 2.11-2.12A31.18 31.18 0 0 0 24 12a31.18 31.18 0 0 0-.5-5.81zM9.75 15.5v-7l6.25 3.5-6.25 3.5z"/></svg>
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">YouTube</span>
                </a>
              )}
              {typeof socialLinks?.linkedin === 'string' && socialLinks.linkedin && (
                <a href={socialLinks.linkedin as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* LinkedIn */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-blue-700"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">LinkedIn</span>
                </a>
              )}
              {typeof socialLinks?.pinterest === 'string' && socialLinks.pinterest && (
                <a href={socialLinks.pinterest as string} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                  {/* Pinterest */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-red-500"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
                  <span className="text-[13px] font-outfit text-stone-600 dark:text-stone-400">Pinterest</span>
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
