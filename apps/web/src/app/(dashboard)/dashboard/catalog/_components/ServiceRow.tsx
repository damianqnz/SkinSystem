'use client';

import { useActionState, useEffect, useOptimistic, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Circle, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { toggleServiceStatusAction } from '../actions';
import type { CatalogActionState } from '../actions';
import type { ServiceRow as ServiceRowType } from '@/domains/catalog/service';

interface ServiceRowProps {
  service:  ServiceRowType;
  locale:   string;
  onEdit:   (service: ServiceRowType) => void;
  index:    number;
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
    style:    'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function ServiceRow({ service, locale, onEdit, index }: ServiceRowProps) {
  const [state, dispatch, isPending] = useActionState<CatalogActionState, unknown>(
    toggleServiceStatusAction, IDLE
  );

  // Optimistic toggle — flips immediately, reverts on error
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

    // navigator.clipboard requires HTTPS; fall back to execCommand for HTTP (local dev)
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => toast.success('Link copiado'))
        .catch(() => toast.error('No se pudo copiar el link'));
      return;
    }

    // Fallback: create a temporary textarea and use execCommand
    const el = document.createElement('textarea');
    el.value = url;
    el.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
    document.body.appendChild(el);
    el.focus();
    el.select();
    try {
      document.execCommand('copy');
      toast.success('Link copiado');
    } catch {
      toast.error('No se pudo copiar el link');
    } finally {
      document.body.removeChild(el);
    }
  }, [service.id]);

  const name  = resolveI18n(service.nameI18n, locale);
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
      {/* Color dot + Name */}
      <td className="py-3.5 pl-4 pr-3">
        <div className="flex items-center gap-3">
          {service.color ? (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: service.color }}
            />
          ) : (
            <Circle size={8} className="text-stone-200 flex-shrink-0" />
          )}
          <span className="font-cormorant text-[15px] font-semibold text-stone-800 leading-tight">
            {name}
          </span>
        </div>
      </td>

      {/* Price */}
      <td className="py-3.5 px-3 tabular-nums">
        <span className="font-outfit text-sm font-semibold text-stone-700">{price}</span>
      </td>

      {/* Duration */}
      <td className="py-3.5 px-3 hidden sm:table-cell">
        <span className="font-outfit text-sm text-stone-500 tabular-nums">
          {service.durationMinutes} min
        </span>
      </td>

      {/* Deposit */}
      <td className="py-3.5 px-3 hidden md:table-cell">
        <span className="font-outfit text-xs tabular-nums text-stone-500">
          {service.depositPercent}%
        </span>
      </td>

      {/* Status badge */}
      <td className="py-3.5 px-3 hidden sm:table-cell">
        <span className={[
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide',
          optimisticActive
            ? 'bg-emerald-50 text-emerald-700'
            : 'bg-stone-100 text-stone-500',
        ].join(' ')}>
          <span className={['w-1.5 h-1.5 rounded-full', optimisticActive ? 'bg-emerald-400' : 'bg-stone-300'].join(' ')} />
          {optimisticActive ? 'Activo' : 'Inactivo'}
        </span>
      </td>

      {/* Actions */}
      <td className="py-3.5 pl-3 pr-4">
        {/* On mobile always visible; on sm+ fades in on row hover */}
        <div className="flex items-center justify-end gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          {/* Copy booking link */}
          <button
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium text-stone-500 hover:text-amber-700 hover:bg-amber-50 transition-colors"
            title="Copiar link de reserva"
          >
            <Link2 size={11} strokeWidth={1.8} />
            <span className="hidden md:inline">Copiar link</span>
          </button>

          {/* Toggle */}
          <button
            onClick={handleToggle}
            disabled={isPending}
            className="p-1.5 rounded-md text-[10px] font-medium text-stone-500 hover:bg-stone-100 transition-colors disabled:opacity-40"
            title={optimisticActive ? 'Desactivar' : 'Activar'}
          >
            {optimisticActive ? 'OFF' : 'ON'}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(service)}
            className="p-1.5 rounded-md text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
            title="Editar"
          >
            <Pencil size={13} />
          </button>
        </div>
      </td>
    </motion.tr>
  );
}
