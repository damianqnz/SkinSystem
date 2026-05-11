'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Search, Download, Loader2, CalendarRange, ExternalLink,
  ChevronsUpDown, ChevronUp, ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { getPaymentHistoryAction } from '../actions';
import type { PaymentHistoryRow } from '@/domains/billing/service-history';

// ── Constants ─────────────────────────────────────────────────

const PAGE_SIZE = 15;

const INTL_LOCALE_MAP: Record<string, string> = {
  es: 'es-ES',
  en: 'en-GB',
  pt: 'pt-PT',
};

const STATUS_PRIORITY: Record<string, number> = {
  succeeded: 0,
  pending:   1,
  failed:    2,
  refunded:  3,
};

// ── Types ─────────────────────────────────────────────────────

type SortKey = 'date' | 'client' | 'staff' | 'service' | 'serviceDate' | 'amount' | 'status';
type SortDir = 'asc' | 'desc';

type ColDef =
  | { sortKey: SortKey; label: string; sortable: true }
  | { sortKey: null;    label: string; sortable: false };

// ── Helpers ───────────────────────────────────────────────────

function toIntlLocale(locale: string): string {
  return INTL_LOCALE_MAP[locale] ?? 'pt-PT';
}

function fmtMoney(cents: number, currency: string, intlLocale: string) {
  return new Intl.NumberFormat(intlLocale, { style: 'currency', currency: currency.toUpperCase() }).format(cents / 100);
}

function fmtDate(iso: string | null, intlLocale = 'pt-PT') {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtDateShort(iso: string, intlLocale = 'pt-PT') {
  return new Date(iso).toLocaleDateString(intlLocale, { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function resolveI18n(obj: unknown, locale = 'pt'): string {
  if (!obj || typeof obj !== 'object') return '—';
  const o = obj as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '—';
}

// ── Today's date helpers ──────────────────────────────────────

function todayISO() { return new Date().toISOString().slice(0, 10); }
function firstDayOfMonthISO() {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
}

// ── Component ─────────────────────────────────────────────────

export function PaymentHistoryTable() {
  const t          = useTranslations('dashboard.billing.history');
  const locale     = useLocale();
  const intlLocale = toIntlLocale(locale);

  const STATUS_MAP: Record<string, { label: string; cls: string }> = {
    succeeded: { label: t('statusSucceeded'), cls: 'bg-emerald-50 text-emerald-700' },
    pending:   { label: t('statusPending'),   cls: 'bg-amber-50   text-amber-700'   },
    failed:    { label: t('statusFailed'),    cls: 'bg-rose-50    text-rose-600'     },
    refunded:  { label: t('statusRefunded'),  cls: 'bg-sky-50     text-sky-700'      },
  };

  const [from,        setFrom]        = useState(firstDayOfMonthISO());
  const [to,          setTo]          = useState(todayISO());
  const [rows,        setRows]        = useState<PaymentHistoryRow[]>([]);
  const [search,      setSearch]      = useState('');
  const [loaded,      setLoaded]      = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey,     setSortKey]     = useState<SortKey | null>(null);
  const [sortDir,     setSortDir]     = useState<SortDir | null>(null);
  const [pending, startTransition]    = useTransition();

  function handleGenerate() {
    startTransition(async () => {
      const res = await getPaymentHistoryAction({ from, to });
      if (res.error) { toast.error(res.error.message); return; }
      setRows(res.data ?? []);
      setLoaded(true);
      setCurrentPage(1);
    });
  }

  function handleSearch(value: string) {
    setSearch(value);
    setCurrentPage(1);
  }

  function handleSort(key: SortKey) {
    if (sortKey !== key) {
      setSortKey(key);
      setSortDir('asc');
    } else if (sortDir === 'asc') {
      setSortDir('desc');
    } else {
      // desc → back to original query order
      setSortKey(null);
      setSortDir(null);
    }
    setCurrentPage(1);
  }

  function handleExportCsv() {
    const statusLabels: Record<string, string> = {
      succeeded: t('statusSucceeded'),
      pending:   t('statusPending'),
      failed:    t('statusFailed'),
      refunded:  t('statusRefunded'),
    };
    const cols = [
      t('csvColDate'), t('csvColClient'), t('csvColStaff'), t('csvColService'),
      t('csvColServiceDate'), t('csvColAmount'), t('csvColMethod'), t('csvColStripeId'),
      t('csvColStatus'), t('csvColAppointmentId'),
    ];
    const lines = [cols.join(';')];
    for (const r of filtered) {
      lines.push([
        fmtDate(r.paidAt ?? r.createdAt, intlLocale),
        r.clientName,
        r.staffName ?? '—',
        resolveI18n(r.serviceNameI18n),
        fmtDateShort(r.serviceDate, intlLocale),
        fmtMoney(r.amountCents, r.currency, intlLocale),
        r.method,
        r.stripeIntentId,
        statusLabels[r.status] ?? r.status,
        r.appointmentId,
      ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';'));
    }
    // UTF-8 BOM so Excel detects encoding correctly
    const bom  = '﻿';
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `pagamentos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const term = search.trim().toLowerCase();

  // Pipeline: rows → filtered (search) → sorted → paged
  const filtered = useMemo(() => {
    if (!term) return rows;
    return rows.filter((r) => {
      const svcName = resolveI18n(r.serviceNameI18n, locale).toLowerCase();
      return r.clientName.toLowerCase().includes(term)
        || svcName.includes(term)
        || (r.paidAt ?? r.createdAt).slice(0, 10).includes(term);
    });
  }, [rows, term, locale]);

  const sorted = useMemo(() => {
    if (!sortKey || !sortDir) return filtered;
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case 'date':
          cmp = (a.paidAt ?? a.createdAt).localeCompare(b.paidAt ?? b.createdAt);
          break;
        case 'client':
          cmp = a.clientName.localeCompare(b.clientName, locale);
          break;
        case 'staff':
          cmp = (a.staffName ?? '').localeCompare(b.staffName ?? '', locale);
          break;
        case 'service':
          cmp = resolveI18n(a.serviceNameI18n, locale)
                  .localeCompare(resolveI18n(b.serviceNameI18n, locale), locale);
          break;
        case 'serviceDate':
          cmp = a.serviceDate.localeCompare(b.serviceDate);
          break;
        case 'amount':
          cmp = a.amountCents - b.amountCents;
          break;
        case 'status':
          cmp = (STATUS_PRIORITY[a.status] ?? 99) - (STATUS_PRIORITY[b.status] ?? 99);
          break;
      }
      return sortDir === 'desc' ? -cmp : cmp;
    });
  }, [filtered, sortKey, sortDir, locale]);

  const totalPages     = Math.ceil(filtered.length / PAGE_SIZE);
  const showPagination = filtered.length > PAGE_SIZE;

  const paged = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sorted.slice(start, start + PAGE_SIZE);
  }, [sorted, currentPage]);

  const COLUMNS: ColDef[] = [
    { sortKey: 'date',        label: t('colDate'),          sortable: true  },
    { sortKey: 'client',      label: t('colClient'),        sortable: true  },
    { sortKey: 'staff',       label: t('colStaff'),         sortable: true  },
    { sortKey: 'service',     label: t('colService'),       sortable: true  },
    { sortKey: 'serviceDate', label: t('colServiceDate'),   sortable: true  },
    { sortKey: 'amount',      label: t('colAmount'),        sortable: true  },
    { sortKey: null,          label: t('colMethod'),        sortable: false },
    { sortKey: 'status',      label: t('colStatus'),        sortable: true  },
    { sortKey: null,          label: t('colAppointmentId'), sortable: false },
  ];

  return (
    <div className="space-y-4">
      {/* Date range + search row */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
              {t('dateFromLabel')}
            </label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-stone-400 uppercase tracking-wider">
              {t('dateToLabel')}
            </label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-stone-200 rounded-xl px-3 py-2 text-sm text-stone-700 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={pending}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
          >
            {pending ? <Loader2 size={14} className="animate-spin" /> : <CalendarRange size={14} />}
            {t('generateBtn')}
          </button>
        </div>

        {loaded && rows.length > 0 && (
          <div className="flex items-end gap-2 ml-auto">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t('searchPlaceholder')}
                className="pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700
                           placeholder:text-stone-400 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors w-56"
              />
            </div>
            <button
              onClick={handleExportCsv}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors"
            >
              <Download size={13} />
              {t('exportCsvBtn')}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      {loaded && (
        filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-100 py-12 text-center">
            <p className="text-sm text-stone-400">
              {rows.length === 0 ? t('emptyNoData') : t('emptySearch')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-stone-50">
                    {COLUMNS.map((col) =>
                      col.sortable ? (
                        <th
                          key={col.sortKey}
                          aria-sort={
                            sortKey === col.sortKey
                              ? sortDir === 'asc' ? 'ascending' : 'descending'
                              : 'none'
                          }
                          className="group/sort py-2.5 px-3 text-left whitespace-nowrap cursor-pointer"
                        >
                          <button
                            type="button"
                            onClick={() => handleSort(col.sortKey)}
                            aria-label={t('sortByLabel', { column: col.label })}
                            className="flex items-center gap-1 text-[10px] font-medium text-stone-400 uppercase tracking-widest focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-300 rounded-sm"
                          >
                            {col.label}
                            {sortKey === col.sortKey && sortDir === 'asc' ? (
                              <ChevronUp
                                size={11}
                                strokeWidth={2}
                                className="opacity-100 transition-opacity duration-150"
                              />
                            ) : sortKey === col.sortKey && sortDir === 'desc' ? (
                              <ChevronDown
                                size={11}
                                strokeWidth={2}
                                className="opacity-100 transition-opacity duration-150"
                              />
                            ) : (
                              <ChevronsUpDown
                                size={11}
                                strokeWidth={1.75}
                                className="opacity-0 group-hover/sort:opacity-50 [@media(hover:none)]:opacity-50 transition-opacity duration-150"
                              />
                            )}
                          </button>
                        </th>
                      ) : (
                        <th
                          key={col.label}
                          className="py-2.5 px-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest whitespace-nowrap"
                        >
                          {col.label}
                        </th>
                      )
                    )}
                    <th className="py-2.5 px-3" />
                  </tr>
                </thead>
                <tbody>
                  {paged.map((r) => {
                    const s = STATUS_MAP[r.status] ?? { label: r.status, cls: 'bg-stone-100 text-stone-500' };
                    return (
                      <tr key={r.paymentId} className="border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                        <td className="py-3 px-3 whitespace-nowrap text-xs text-stone-600">
                          {fmtDate(r.paidAt ?? r.createdAt, intlLocale)}
                        </td>
                        <td className="py-3 px-3 font-medium text-stone-800 whitespace-nowrap">{r.clientName}</td>
                        <td className="py-3 px-3 text-stone-500 whitespace-nowrap">{r.staffName ?? '—'}</td>
                        <td className="py-3 px-3 text-stone-700 max-w-[140px] truncate">
                          {resolveI18n(r.serviceNameI18n, locale)}
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-500 whitespace-nowrap">
                          {fmtDateShort(r.serviceDate, intlLocale)}
                        </td>
                        <td className="py-3 px-3 font-semibold text-stone-800 tabular-nums whitespace-nowrap">
                          {fmtMoney(r.amountCents, r.currency, intlLocale)}
                        </td>
                        <td className="py-3 px-3 text-xs text-stone-500">{r.method}</td>
                        <td className="py-3 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${s.cls}`}>
                            {s.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-[10px] text-stone-400 max-w-[80px] truncate">
                          {r.appointmentId.slice(0, 8)}…
                        </td>
                        <td className="py-3 px-3">
                          <a
                            href={`https://dashboard.stripe.com/payments/${r.stripeIntentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-stone-300 hover:text-stone-600 transition-colors"
                            title={t('viewInStripe')}
                          >
                            <ExternalLink size={12} />
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Footer — pagination controls (only when rows exceed one page) */}
            <div className="px-4 py-2.5 border-t border-stone-50 flex items-center justify-between">
              {showPagination && (
                <>
                  <p className="text-[11px] text-stone-400">
                    {t('pageIndicator', {
                      from:       (currentPage - 1) * PAGE_SIZE + 1,
                      to:         Math.min(currentPage * PAGE_SIZE, filtered.length),
                      total:      filtered.length,
                      page:       currentPage,
                      totalPages,
                    })}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => p - 1)}
                      disabled={currentPage === 1}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('prevBtn')}
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => p + 1)}
                      disabled={currentPage === totalPages}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {t('nextBtn')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )
      )}

      {/* Initial empty state */}
      {!loaded && (
        <div className="bg-white rounded-2xl border border-stone-100 border-dashed py-12 text-center">
          <CalendarRange size={24} className="text-stone-300 mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm text-stone-400">
            {t('emptyInitial', { generateBtn: t('generateBtn') })}
          </p>
        </div>
      )}
    </div>
  );
}
