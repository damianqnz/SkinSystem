'use client';

import { useState, useTransition }                                     from 'react';
import { Plus, MoreVertical, Pencil, Trash2, Percent, DollarSign }     from 'lucide-react';
import * as DropdownMenu                                                from '@radix-ui/react-dropdown-menu';
import { toast }                                                        from 'sonner';
import { deleteSurchargeAction }                                        from '../actions-surcharges';
import type { SurchargeRow }                                            from '../actions-surcharges';
import { SurchargeModal }                                               from './SurchargeModal';

// ── Helpers ───────────────────────────────────────────────────

function fmtValue(row: SurchargeRow) {
  return row.valueType === 'percent'
    ? `${row.value}%`
    : `€${parseFloat(row.value).toFixed(2)}`;
}

// ── Surcharge row item ────────────────────────────────────────

function SurchargeItem({
  row,
  onEdit,
  onDelete,
}: {
  row:      SurchargeRow;
  onEdit:   (r: SurchargeRow) => void;
  onDelete: (id: string) => void;
}) {
  const [pending, startTransition] = useTransition();
  const Icon = row.valueType === 'percent' ? Percent : DollarSign;

  function handleDelete() {
    startTransition(async () => {
      const res = await deleteSurchargeAction(row.id);
      if (res.error) { toast.error(res.error); return; }
      toast.success('Removido');
      onDelete(row.id);
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 bg-white rounded-xl border border-stone-100
                    px-4 py-3 shadow-sm group transition-shadow hover:shadow">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg
          ${row.isReduction ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-600'}`}>
          <Icon size={14} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-stone-800 truncate">{row.name}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            {row.isReduction ? 'Redução' : 'Taxa'} · {fmtValue(row)}
          </p>
        </div>
      </div>

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
              Editar
            </DropdownMenu.Item>
            <DropdownMenu.Item
              onSelect={handleDelete}
              className="flex items-center gap-2 px-3 py-2 text-rose-600 cursor-pointer
                         hover:bg-rose-50 focus:outline-none"
            >
              <Trash2 size={13} />
              Remover
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </div>
  );
}

// ── Section ───────────────────────────────────────────────────

interface Props {
  initial: SurchargeRow[];
}

export function SurchargesSection({ initial }: Props) {
  const [rows,    setRows]    = useState<SurchargeRow[]>(initial);
  const [modal,   setModal]   = useState(false);
  const [editing, setEditing] = useState<SurchargeRow | null>(null);

  const taxes      = rows.filter((r) => !r.isReduction).length;
  const reductions = rows.filter((r) =>  r.isReduction).length;
  const canAdd     = taxes < 2 || reductions < 1;

  function openCreate() { setEditing(null); setModal(true); }
  function openEdit(r: SurchargeRow) { setEditing(r); setModal(true); }
  function closeModal() { setModal(false); setEditing(null); }

  function handleSaved(row: SurchargeRow) {
    setRows((prev) => {
      const idx = prev.findIndex((r) => r.id === row.id);
      return idx >= 0 ? prev.map((r, i) => (i === idx ? row : r)) : [...prev, row];
    });
    closeModal();
  }

  function handleDelete(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          Taxas e reduções
        </h2>
        <p className="text-xs text-stone-400 mt-1">
          Gostaria de aplicar cobranças adicionais ou reduções aos pagamentos?
        </p>
      </div>

      <div className="space-y-2">
        {rows.length === 0 ? (
          <div className="bg-white rounded-xl border border-stone-100 border-dashed px-5 py-6 text-center">
            <p className="text-sm text-stone-400">Nenhuma taxa ou redução configurada.</p>
          </div>
        ) : (
          rows.map((r) => (
            <SurchargeItem key={r.id} row={r} onEdit={openEdit} onDelete={handleDelete} />
          ))
        )}

        {canAdd ? (
          <button
            onClick={openCreate}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-dashed
                       border-stone-200 py-2.5 text-sm text-stone-500 hover:border-amber-300
                       hover:text-amber-700 hover:bg-amber-50/40 transition-colors"
          >
            <Plus size={14} />
            Adicionar taxa ou redução
          </button>
        ) : (
          <p className="text-xs text-stone-400 text-center py-1">
            Limite atingido: 2 taxas e 1 redução
          </p>
        )}
      </div>

      <SurchargeModal
        open={modal}
        editing={editing}
        onClose={closeModal}
        onSaved={handleSaved}
      />
    </section>
  );
}
