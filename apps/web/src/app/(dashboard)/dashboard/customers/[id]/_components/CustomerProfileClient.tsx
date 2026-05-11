'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGSAP }   from '@gsap/react';
import gsap          from 'gsap';
import * as Tabs     from '@radix-ui/react-tabs';
import Image         from 'next/image';
import { CalendarPlus, Pencil, Stethoscope } from 'lucide-react';
import Link          from 'next/link';
import { toast }     from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { CustomerStatusBadge }  from '../../_components/CustomerStatusBadge';
import { CustomerFormModal }    from '../../_components/CustomerFormModal';
import { CustomerActionsMenu }  from './CustomerActionsMenu';
import { SobreTab }             from './SobreTab';
import { CompromisosTab }       from './CompromisosTab';
import { NewAppointmentFAB }    from '@/app/(dashboard)/dashboard/calendar/_components/NewAppointmentFAB';
import { uploadAvatarAction }   from '../../actions/upload-avatar';
import { cn }        from '@/shared/lib/utils';
import type { ClientStatus } from '@/domains/customers/service';
import type { CustomerMatch } from '@/app/(dashboard)/dashboard/calendar/actions/search-customers';

const PALETTES = [
  { bg: '#F5F0E8', fg: '#8B7355' }, { bg: '#EFF6FF', fg: '#3B82F6' },
  { bg: '#F0FDF4', fg: '#15803D' }, { bg: '#FFF7ED', fg: '#C2410C' },
  { bg: '#FDF4FF', fg: '#9333EA' }, { bg: '#F0FDFA', fg: '#0F766E' },
];
function avatarPalette(name: string) {
  let h = 0; for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return PALETTES[Math.abs(h) % PALETTES.length]!;
}
function initials(name: string) { return name.trim().split(/\s+/).slice(0, 2).map(p => p[0]!.toUpperCase()).join(''); }

interface Props {
  id: string; fullName: string; email: string | null; phone: string | null;
  isGuest: boolean; visitCount: number; lastVisitAtIso: string | null;
  status: ClientStatus; createdAtIso: string; locale: string;
  isBlocked: boolean; avatarUrl: string | null; notes: string | null;
  company?: string | null; country?: string | null; countryIso?: string | null;
  address?: string | null; city?: string | null; state?: string | null;
  postalCode?: string | null; socialLinks?: Record<string, unknown> | null;
}

const TR = 'px-3 py-2.5 font-sans text-[11px] uppercase tracking-wider border-b-2 border-transparent transition-colors data-[state=active]:border-[#D4AF37] data-[state=active]:text-stone-900 text-stone-400 disabled:opacity-30 disabled:cursor-not-allowed';

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

export function CustomerProfileClient({ id, fullName, email, phone, isGuest, visitCount, lastVisitAtIso, status, createdAtIso, locale, isBlocked: initialBlocked, avatarUrl: initialAvatarUrl, notes, company, country, countryIso, address, city, state, postalCode, socialLinks }: Props) {
  const t            = useTranslations('dashboard.customers.profile');
  const intlLocale   = useLocale();
  const router       = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fabOpen,       setFabOpen]       = useState(false);
  const [editOpen,      setEditOpen]      = useState(false);
  const [isBlocked,     setIsBlocked]     = useState(initialBlocked);
  const [avatarUrl,     setAvatarUrl]     = useState(initialAvatarUrl);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const initialCustomer: CustomerMatch = { id, fullName, email, phone };
  const pal = avatarPalette(fullName);

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    const d    = new Date(iso);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0) return t('today');
    const tag = INTL_LOCALE_MAP[intlLocale] ?? 'pt-PT';
    return d.toLocaleDateString(tag, { day: 'numeric', month: 'short', year: 'numeric' });
  }

  useGSAP(() => {
    gsap.from(containerRef.current, { opacity: 0, y: 20, duration: 0.35, ease: 'power2.out' });
  }, { scope: containerRef });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData(); fd.append('avatar', file);
    setAvatarLoading(true);
    const res = await uploadAvatarAction(id, fd);
    setAvatarLoading(false);
    if (res.error) { toast.error(res.error.message); return; }
    setAvatarUrl(res.data!.avatarUrl);
    e.target.value = '';
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      {/* Blocked banner */}
      {isBlocked && (
        <div className="flex items-center justify-between px-4 py-2 bg-rose-50 border-b border-rose-100 shrink-0">
          <p className="font-sans text-sm text-rose-600">{t('blockedBanner')}</p>
        </div>
      )}

      {/* Profile header */}
      <div className="p-6 border-b border-spa-border space-y-4 shrink-0">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <button onClick={() => fileInputRef.current?.click()} disabled={avatarLoading}
            className="relative w-20 h-20 rounded-sm flex items-center justify-center shrink-0 overflow-hidden group"
            style={{ backgroundColor: pal.bg }} aria-label={t('photoAriaLabel')}>
            {avatarUrl
              ? <Image src={avatarUrl} alt={fullName} fill className="object-cover" sizes="80px" />
              : <span className="font-serif text-3xl font-light" style={{ color: pal.fg }}>{initials(fullName)}</span>
            }
            {avatarLoading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          </button>
          <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileChange} />

          {/* Identity */}
          <div className="flex-1 min-w-0 space-y-1.5 pt-0.5">
            <h1 className="font-serif text-2xl font-light text-stone-900 leading-tight truncate">{fullName}</h1>
            <div className="flex flex-wrap items-center gap-2">
              <CustomerStatusBadge status={status} locale={locale} />
              {isGuest && (
                <span className="font-sans text-[9px] uppercase tracking-widest px-2 py-0.5 border border-stone-300 text-stone-400 rounded-sm">
                  {t('guestBadge')}
                </span>
              )}
            </div>
            <p className="font-sans text-xs text-stone-400">
              {t('visits', { count: visitCount })}
              {lastVisitAtIso && <span className="mx-1">·</span>}
              {lastVisitAtIso && fmtDate(lastVisitAtIso)}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-0.5 shrink-0">
            <button onClick={() => setEditOpen(true)} className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 transition-colors" aria-label={t('editAriaLabel')}>
              <Pencil size={14} strokeWidth={1.5} />
            </button>
            <CustomerActionsMenu customerId={id} fullName={fullName} locale={locale} isBlocked={isBlocked} onBlockToggled={setIsBlocked} />
          </div>
        </div>

        {/* CTAs */}
        <div className="flex gap-2">
          <button onClick={() => setFabOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm border border-[#D4AF37] text-[#D4AF37] text-sm font-sans hover:bg-amber-50 transition-colors">
            <CalendarPlus size={14} strokeWidth={1.5} />
            {t('scheduleCta')}
          </button>
          <Link href={`/dashboard/customers/${id}/ficha`}
            className={cn('flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm border border-stone-200 text-stone-600 text-sm font-sans hover:bg-stone-50 transition-colors')}>
            <Stethoscope size={14} strokeWidth={1.5} />
            {t('fichaCta')}
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <Tabs.Root defaultValue="sobre" className="flex-1 flex flex-col min-h-0">
        <Tabs.List className="flex border-b border-spa-border px-4 shrink-0">
          <Tabs.Trigger value="sobre"       className={TR}>{t('tabAbout')}</Tabs.Trigger>
          <Tabs.Trigger value="notas"       className={TR} disabled>{t('tabNotes')}</Tabs.Trigger>
          <Tabs.Trigger value="compromisos" className={TR}>{t('tabAppointments')}</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="sobre" className="flex-1 overflow-y-auto p-6">
          <SobreTab
            locale={locale} email={email} phone={phone} createdAtIso={createdAtIso}
            company={company} country={country} address={address} city={city}
            state={state} postalCode={postalCode} notes={notes} socialLinks={socialLinks}
          />
        </Tabs.Content>
        <Tabs.Content value="notas" className="flex-1 p-6">
          <p className="font-sans text-sm text-stone-400 text-center mt-6">{t('notesSoon')}</p>
        </Tabs.Content>
        <Tabs.Content value="compromisos" className="flex-1 overflow-y-auto p-6">
          <CompromisosTab customerId={id} locale={locale} />
        </Tabs.Content>
      </Tabs.Root>

      <NewAppointmentFAB locale={locale} date={new Date()} externalOpen={fabOpen} onExternalClose={() => setFabOpen(false)} initialCustomer={initialCustomer} />
      <CustomerFormModal
        mode="edit"
        open={editOpen}
        onClose={() => setEditOpen(false)}
        locale={locale}
        onSuccess={() => { setEditOpen(false); router.refresh(); }}
        customer={{ id, fullName, email, phone, notes, company, country, address, city, state, postalCode, socialLinks: socialLinks ?? null, avatarUrl: avatarUrl }}
      />
    </div>
  );
}
