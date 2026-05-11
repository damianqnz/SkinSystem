'use client';

import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { CustomerStatusBadge } from './CustomerStatusBadge';
import { cn } from '@/shared/lib/utils';
import type { ClientStatus } from '@/domains/customers/service';

export type CustomerSer = {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  lastVisitAtIso: string | null;
  visitCount: number;
  status: ClientStatus;
  isBlocked: boolean;
};

const PALETTES = [
  { bg: '#F5F0E8', fg: '#8B7355' },
  { bg: '#EFF6FF', fg: '#3B82F6' },
  { bg: '#F0FDF4', fg: '#15803D' },
  { bg: '#FFF7ED', fg: '#C2410C' },
  { bg: '#FDF4FF', fg: '#9333EA' },
  { bg: '#F0FDFA', fg: '#0F766E' },
];

const INTL_LOCALE_MAP: Record<string, string> = { pt: 'pt-PT', es: 'es-ES', en: 'en-GB' };

function avatarPalette(name: string) {
  let h = 0; for (const c of name) h = (h << 5) - h + c.charCodeAt(0);
  return PALETTES[Math.abs(h) % PALETTES.length]!;
}
function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    : name.slice(0, 2).toUpperCase();
}

interface Props { customer: CustomerSer; locale: string; isSelected: boolean }

export function CustomerListItem({ customer, locale, isSelected }: Props) {
  const router     = useRouter();
  const intlLocale = useLocale();
  const t          = useTranslations('dashboard.customers.profile');
  const pal        = avatarPalette(customer.fullName);
  const ini        = initials(customer.fullName);

  function fmtDate(iso: string | null): string {
    if (!iso) return '—';
    const d    = new Date(iso);
    const now  = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
    if (diff === 0) return t('today');
    if (diff < 7)   return `${diff}d`;
    const tag = INTL_LOCALE_MAP[intlLocale] ?? 'pt-PT';
    return d.toLocaleDateString(tag, { day: 'numeric', month: 'short' });
  }

  return (
    <button
      type="button"
      onClick={() => router.push(`/dashboard/customers/${customer.id}`)}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors min-h-[44px]',
        'border-l-2',
        isSelected
          ? 'bg-stone-100 border-[#D4AF37]'
          : 'border-transparent hover:bg-stone-50',
      )}
    >
      {/* Avatar */}
      <div className="w-9 h-9 rounded-sm flex items-center justify-center shrink-0" style={{ backgroundColor: pal.bg }}>
        <span className="font-sans text-[11px] font-semibold" style={{ color: pal.fg }}>{ini}</span>
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-sans text-sm font-medium text-stone-800 truncate">{customer.fullName}</p>
        <p className="font-sans text-[11px] text-stone-400 truncate">
          {fmtDate(customer.lastVisitAtIso)}
        </p>
      </div>
      {/* Status + blocked icon */}
      <div className="flex items-center gap-1.5">
        {customer.isBlocked && <ShieldOff size={12} strokeWidth={1.5} className="text-rose-400 shrink-0" />}
        <CustomerStatusBadge status={customer.status} locale={locale} />
      </div>
    </button>
  );
}
