'use client';

import { useActionState, useEffect, useOptimistic, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Circle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { toggleServiceStatusAction } from '../actions';
import type { CatalogActionState } from '../actions';
import type { ServiceRow as ServiceRowType } from '@/domains/catalog/service';

interface ServiceRowProps {
  service: ServiceRowType;
  locale:  string;
  onEdit:  (service: ServiceRowType) => void;
  index:   number;
}

const IDLE: CatalogActionState = { status: 'idle' };
const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

function resolveI18n(obj: unknown, locale: string): string {
  if (!obj || typeof obj !== 'object') return '—';
  const o = obj as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '—';
}

function fmtPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency', currency,
    minimumFractionDigits: 0, maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function ServiceRow({ service, locale, onEdit, index }: ServiceRowProps) {
  const t          = useTranslations('dashboard.catalog');
  const intlLocale = useLocale();
  const [state, dispatch, isPending] = useActionState<CatalogActionState, unknown>(toggleServiceStatusAction, IDLE);
  const [optimisticActive, setOptimisticActive] = useOptimistic(service.isActive);

  useEffect(() => {
    if (state.status === 'success') toast.success(state.message);
    if (state.status === 'error')   toast.error(state.message);
  }, [state]);

  function handleToggle() {
    const next = !optimisticActive;
    setOptimisticActive(next);
    (dispatch as (p: unknown) => void)({ id: service.id, isActive: next });
  }

  const handleCopyLink = useCallback(() => {
    const url = `${window.location.origin}/book?service=${service.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success(t('linkCopied')))
        .catch(() => toast.error(t('linkCopyError')));
      return;
    }
    const el = document.createElement('textarea');
    el.value = url;
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(el);
    el.focus(); el.select();
    try {
      document.execCommand('copy');
      toast.success(t('linkCopied'));
    } catch {
      toast.error(t('linkCopyError'));
    } finally {
      document.body.removeChild(el);
    }
  }, [service.id, t]);

  const name  = resolveI18n(service.nameI18n, intlLocale);
  const price = fmtPrice(service.priceCents, service.currency);

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: EASE, delay: index * 0.04 }}
      className={[
        'group border-b border-stone-50 last:border-0 transition-colors',
        optimisticActive ? 'hover:bg-stone-50/60' : 'opacity-60 hover:opacity-80',
      ].join(' ')}
    >
      <td className="py-3.5 pl-4 pr-3">
        <div className="flex items-center gap-3">
          {service.color ? (
            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: service.color }} />
          ) : (
            <Circle size={8} className="text-stone-200 shrink-0" />
          )}
          <span className="font-cormorant text-[15px] font-semibold text-stone-800 leading-tight">{name}</span>
        </div>
      </td>
      <td className="py-3.5 px-3 tabular-nums">
        <span className="font-outfit text-sm font-semibold text-stone-700">{price}</span>
      </td>
      <td className="py-3.5 px-3 hidden sm:table-cell">
        <span className="font-outfit text-sm text-stone-500 tabular-nums">{service.durationMinutes} min</span>
      </td>
      <td className="py-3.5 px-3 hidden md:table-cell">
        <span className="font-outfit text-xs tabular-nums text-stone-500">{service.depositPercent}%</span>
      </td>
      <td className="py-3.5 px-3 hidden sm:table-cell">
        <span className={[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
          optimisticActive ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500',
        ].join(' ')}>
          <span className={['w-1.5 h-1.5 rounded-full', optimisticActive ? 'bg-emerald-400' : 'bg-stone-300'].join(' ')} />
          {optimisticActive ? t('statusActive') : t('statusInactive')}
        </span>
      </td>
      <td className="py-3.5 pl-3 pr-4">
        <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
            title={t('copyLinkTitle')}
          >
            <Link2 size={11} strokeWidth={1.8} />
            <span className="hidden md:inline">{t('copyLink')}</span>
          </button>
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="p-1.5 rounded-md text-[10px] font-medium text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40"
            title={optimisticActive ? t('deactivate') : t('activate')}
          >
            {optimisticActive ? 'OFF' : 'ON'}
          </button>
          <button
            onClick={() => onEdit(service)}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title={t('editTitle')}
          >
            <Pencil size={13} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
