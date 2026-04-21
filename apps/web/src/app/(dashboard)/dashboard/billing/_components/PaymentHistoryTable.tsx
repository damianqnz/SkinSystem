'use client';

import { useState, useTransition, useMemo } from 'react';
import { Search, Download, Loader2, CalendarRange, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { getPaymentHistoryAction } from '../actions';
import type { PaymentHistoryRow } from '@/domains/billing/service-history';

// ── Helpers ───────────────────────────────────────────────────

function fmtMoney(cents: number, currency: string) {
  return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function fmtDate(iso: string | null, locale = 'pt-PT') {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(iso: string) {
  return new Date(iso).toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resolveI18n(obj: unknown, locale = 'pt'): string {
  if (!obj || typeof obj !== 'object') return '—';
  const o = obj as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '—';
}

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  succeeded: { label: 'Pago',      cls: 'bg-emerald-50 text-emerald-700' },
  pending:   { label: 'Pendente',  cls: 'bg-amber-50   text-amber-700'   },
  failed:    { label: 'Falhou',    cls: 'bg-rose-50    text-rose-600'     },
  refunded:  { label: 'Reembolso', cls: 'bg-sky-50     text-sky-700'      },
};

// ── CSV export ────────────────────────────────────────────────

function exportCsv(rows: PaymentHistoryRow[]) {
  const COLS = ['Data Pagamento','Cliente','Profissional','Serviço','Data Serviço','Valor','Tipo','Método','ID Stripe','Estado','ID Agendamento'];
  const lines = [COLS.join(';')];
  for (const r of rows) {
    const tipo = r.depositPercent < 100 ? `Depósito ${r.depositPercent}%` : 'Total';
    lines.push([
      fmtDate(r.paidAt ?? r.createdAt),
      r.clientName,
      r.staffName ?? '—',
      resolveI18n(r.serviceNameI18n),
      fmtDateShort(r.serviceDate),
      fmtMoney(r.amountCents, r.currency),
      tipo,
      r.method,
      r.stripeIntentId,
      STATUS_MAP[r.status]?.label ?? r.status,
      r.appointmentId,
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'));
  }
  // UTF-8 BOM so Excel detects encoding correctly
  const bom  = '\uFEFF';
  const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `pagamentos_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Today's date helper ───────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10); }
function firstDayOfMonthISO() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────

interface Props { locale?: string; }

export function PaymentHistoryTable({ locale = 'pt' }: Props) {
  const [from,    setFrom]    = useState(firstDayOfMonthISO());
  const [to,      setTo]      = useState(todayISO());
  const [rows,    setRows]    = useState<PaymentHistoryRow[]>([]);
  const [search,  setSearch]  = useState('');
  const [loaded,  setLoaded]  = useState(false);
  const [pending, startTransition] = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const res = await getPaymentHistoryAction({ from, to });
      if (res.error) { toast.error(res.error.message); return; }
      setRows(res.data ?? []);
      setLoaded(true);
    });
  }

  const term = search.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!term) return rows;
    return rows.filter((r) => {
      const svcName = resolveI18n(r.serviceNameI18n, locale).toLowerCase();
      return r.clientName.toLowerCase().includes(term)
        || svcName.includes(term)
        || (r.paidAt ?? r.createdAt).slice(0, 10).includes(term);
    });
  }, [rows, term, locale]);

  return (
    <div className="space-y-4">
      {/* Date range + search row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Desde</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">Hasta</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors" />
          </div>
          <button onClick={handleGenerate} disabled={pending}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
            {pending ? <Loader2 size={14} className="animate-spin" /> : <CalendarRange size={14} />}
            Generar
          </button>
        </div>

        {loaded && rows.length > 0 && (
          <div className="flex items-end gap-2 ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar cliente, servicio, fecha..."
                className="pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700
                           placeholder:text-stone-400 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors w-56" />
            </div>
            <button onClick={() => exportCsv(filtered)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors">
              <Download size={13} />
              Exportar CSV
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loaded && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 py-12 text-center">
            <p className="text-sm text-stone-400">{rows.length === 0 ? 'Sem pagamentos no período selecionado.' : 'Sem resultados para a pesquisa.'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead>
                  <tr className="border-b border-stone-50">
                    {['Data pagamento','Cliente','Profissional','Serviço','Data serviço','Valor','Tipo','Método','Estado','ID Agend.'].map((h) => (
                      <th key={h} className="py-2.5 px-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => {
                    const s = STATUS_MAP[r.status] ?? { label: r.status, cls: 'bg-stone-100 text-stone-500' };
                    const tipo = r.depositPercent < 100 ? `Dep. ${r.depositPercent}%` : 'Total';
                    return (
                      <tr key={r.paymentId} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-xs text-stone-600">{fmtDate(r.paidAt ?? r.createdAt)}</td>
                        <td className="py-3 px-3 font-medium text-stone-800 whitespace-nowrap">{r.clientName}</td>
                        <td className="py-3 px-3 text-stone-500 whitespace-nowrap">{r.staffName ?? '—'}</td>
                        <td className="py-3 px-3 text-stone-700 max-w-[140px] truncate">{resolveI18n(r.serviceNameI18n, locale)}</td>
                        <td className="py-3 px-3 text-xs text-stone-500 whitespace-nowrap">{fmtDateShort(r.serviceDate)}</td>
                        <td className="py-3 px-3 font-semibold text-stone-800 tabular-nums whitespace-nowrap">{fmtMoney(r.amountCents, r.currency)}</td>
                        <td className="py-3 px-3 text-xs text-stone-500 whitespace-nowrap">{tipo}</td>
                        <td className="py-3 px-3 text-xs text-stone-500">{r.method}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>{s.label}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-stone-400 max-w-[80px] truncate">{r.appointmentId.slice(0, 8)}…</td>
                        <td className="py-3 px-3">
                          <a href={`https://dashboard.stripe.com/payments/${r.stripeIntentId}`}
                             target="_blank" rel="noopener noreferrer"
                             className="p-1 text-stone-300 hover:text-stone-600 transition-colors" title="Ver en Stripe">
                            <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-stone-50 flex items-center justify-between">
              <p className="text-[11px] text-stone-400">{filtered.length} registro{filtered.length !== 1 ? 's' : ''}</p>
              {filtered.length < rows.length && (
                <p className="text-[11px] text-stone-400">{rows.length - filtered.length} filtrado{rows.length - filtered.length !== 1 ? 's' : ''}</p>
              )}
            </div>
          </div>
        )
      )}

      {!loaded && (
        <div className="bg-white rounded-2xl border border-stone-100 border-dashed py-12 text-center">
          <CalendarRange size={24} className="text-stone-300 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm text-stone-400">Seleciona o período e clica em <strong className="text-stone-600">Generar</strong> para carregar os pagamentos.</p>
        </div>
      )}
    </div>
  );
}
