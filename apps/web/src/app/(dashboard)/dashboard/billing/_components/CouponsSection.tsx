'use client';

import { useState, useTransition }                                     from 'react';
import * as Switch                                                     from '@radix-ui/react-switch';
import { Plus, MoreVertical, Pencil, Trash2, Tag }                     from 'lucide-react';
import * as DropdownMenu                                               from '@radix-ui/react-dropdown-menu';
import { toast }                                                       from 'sonner';
import { useTranslations, useLocale }                                  from 'next-intl';
import { toggleCouponAction, deleteCouponAction }                      from '../actions-coupons';
import type { CouponRow }                                              from '../actions-coupons';
import { CouponModal }                                                 from './CouponModal';

// ── Helpers ───────────────────────────────────────────────────

const INTL_LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-GB',
  pt: 'pt-PT',
};

function fmtDiscount(row: CouponRow) {
  return row.discountType === 'percent'
    ? `${row.discountValue}%`
    : `€${parseFloat(row.discountValue).toFixed(2)}`;
}

function fmtDate(iso: string, intlLocale: string) {
  return new Date(iso).toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function isExpired(row: CouponRow) {
  if (!row.validUntil) return false;
  return new Date(row.validUntil) < new Date();
}

// ── Coupon item ───────────────────────────────────────────────

function CouponItem({
  row,
  onToggle,
  onEdit,
  onDelete,
}: {
  row:      CouponRow;
  onToggle: (id: string, active: boolean) => void;
  onEdit:   (r: CouponRow) => void;
  onDelete: (id: string) => void;
}) {
  const t = useTranslations('dashboard.billing.coupons');
  const locale = useLocale();
  const intlLocale = INTL_LOCALE_MAP[locale] ?? 'pt-PT';
  const [active,  setActive]  = useState(row.isActive);
  const [pending, startTransition] = useTransition();
  const expired = isExpired(row);

  function handleToggle(val: boolean) {
    setActive(val);
    startTransition(async () => {
      const res = await toggleCouponAction(row.id, val);
      if (res.error) { toast.error(res.error); setActive(!val); return; }
      onToggle(row.id, val);
    });
  }

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteCouponAction(row.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success(t('toastDeleted'));
      onDelete(row.id);
    });
  }

  return (
    <div className={`flex items-center gap-3 bg-white rounded-xl border px-4 py-3 shadow-sm group
                     transition-all hover:shadow
                     ${expired ? 'border-rose-100 opacity-70' : 'border-stone-100'}`}>
      {/* Icon */}
      <span className="shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-amber-50 text-amber-600">
        <Tag size={14} strokeWidth={2} />
      </span>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-sm font-semibold text-stone-800 tracking-wide">{row.code}</span>
          <span className="inline-block bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded-full">
            -{fmtDiscount(row)}
          </span>
          {expired && (
            <span className="inline-block bg-rose-50 text-rose-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
              {t('expired')}
            </span>
          )}
        </div>
        <p className="text-[11px] text-stone-400 mt-0.5 space-x-2">
          {row.maxUses != null && (
            <span>{t('uses', { count: row.usesCount, maxUses: row.maxUses })}</span>
          )}
          {row.maxUses == null && row.usesCount > 0 && (
            <span>{t('usesNoLimit', { count: row.usesCount })}</span>
          )}
          {row.validUntil && (
            <span>{t('expiresOn', { date: fmtDate(row.validUntil, intlLocale) })}</span>
          )}
          {!row.validUntil && !row.maxUses && (
            <span>{t('noLimit')}</span>
          )}
        </p>
      </div>

      {/* Toggle */}
      <Switch.Root
        checked={active}
        onCheckedChange={handleToggle}
        disabled={pending || expired}
        className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent
                   bg-stone-200 transition-colors duration-200
                   data-[state=checked]:bg-amber-400
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        <Switch.Thumb
          className="block h-4 w-4 rounded-full bg-white shadow-sm ring-0
                     transition-transform duration-200
                     data-[state=checked]:translate-x-4
                     data-[state=unchecked]:translate-x-0"
        />
      </Switch.Root>

      {/* 3-dot menu */}
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            disabled={pending}
            className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-50
                       transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40"
          >
            <MoreVertical size={15} />
          </button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[140px] bg-white rounded-xl border border-stone-100 shadow-lg py-1 text-sm"
          >
            <DropdownMenu.Item
              onSelect={() => onEdit(row)}
              className="flex items-center gap-2 px-3 py-2 text-stone-700 cursor-pointer
                         hover:bg-stone-50 focus:outline-none"
            >
              <Pencil size={13} />
              {t('edit')}
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-rose-600 cursor-pointer
                         hover:bg-rose-50 focus:outline-none"
            >
              <Trash2 size={13} />
              {t('remove')}
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────

interface Props {
  initial: CouponRow[];
}

export function CouponsSection({ initial }: Props) {
  const t = useTranslations('dashboard.billing.coupons');
  const [rows,    setRows]    = useState<CouponRow[]>(initial);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<CouponRow | null>(null);

  function openCreate() { setEditing(null); setModal(true); }
  function openEdit(r: CouponRow) { setEditing(r); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); }

  function handleSaved(row: CouponRow) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      return idx >= 0 ? prev.map((r, i) => (i === idx ? row : r)) : [...prev, row];
    });
    closeModal();
  }

  function handleDelete(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function handleToggle(id: string, active: boolean) {
    setRows((prev) => prev.map((r) => r.id === id ? { ...r, isActive: active } : r));
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          {t('sectionTitle')}
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          {t('sectionDesc')}
        </p>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-100 border-dashed px-5 py-6 text-center">
            <p className="text-sm text-stone-400">{t('empty')}</p>
          </div>
        ) : (
          rows.map((r) => (
            <CouponItem
              key={r.id}
              row={r}
              onToggle={handleToggle}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}

        <button
          onClick={openCreate}
          className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed
                     border-stone-200 py-2.5 text-sm text-stone-500 hover:border-amber-300
                     hover:text-amber-700 hover:bg-amber-50/40 transition-colors"
        >
          <Plus size={14} />
          {t('createBtn')}
        </button>
      </div>

      <CouponModal
        open={modal}
        editing={editing}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
