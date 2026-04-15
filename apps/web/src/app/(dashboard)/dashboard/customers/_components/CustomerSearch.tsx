'use client';

/**
 * CustomerSearch — Client Component.
 * Owns: search query state, modal open state.
 * Filters the customer list client-side (real-time, no debounce needed for ≤1 000 rows).
 */

import { useState, useMemo } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { CustomersTable, type CustomerRow } from './CustomersTable';
import { AddCustomerModal } from './AddCustomerModal';
import { CustomersTableSkeleton } from './CustomersTableSkeleton';

interface Props {
  customers: CustomerRow[];
  locale: string;
}

export function CustomerSearch({ customers, locale }: Props) {
  const [query,     setQuery]     = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.includes(q),
    );
  }, [customers, query]);

  const isFiltered = query.trim().length > 0;

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-6">
        {/* Search input */}
        <div className="relative flex-1">
          <Search
            size={14}
            strokeWidth={1.5}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-spa-muted)] pointer-events-none"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              locale === 'en' ? 'Search by name, email or phone…'
              : locale === 'pt' ? 'Pesquisar por nome, email ou telefone…'
              : 'Buscar por nombre, email o teléfono…'
            }
            className="w-full pl-9 pr-4 py-2.5 font-sans text-sm bg-white/60 backdrop-blur-sm border border-[var(--color-spa-border)] rounded-sm placeholder:text-[var(--color-spa-muted)] text-[var(--color-spa-stone)] focus:outline-none focus:border-[var(--color-spa-stone)] transition-colors"
          />
        </div>

        {/* "Nuevo Cliente" — desktop only; mobile uses FAB */}
        <button
          onClick={() => setModalOpen(true)}
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 shimmer-btn font-sans text-sm font-medium bg-[var(--color-spa-stone)] text-[var(--color-spa-bg)] rounded-sm hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <UserPlus size={14} strokeWidth={1.5} />
          {locale === 'en' ? 'New client' : locale === 'pt' ? 'Novo cliente' : 'Nuevo cliente'}
        </button>
      </div>

      {/* ── Count ────────────────────────────────────────── */}
      {customers.length > 0 && (
        <p className="font-sans text-xs text-[var(--color-spa-muted)] mb-3">
          {isFiltered
            ? `${filtered.length} / ${customers.length} clientes`
            : `${customers.length} ${locale === 'en' ? 'clients' : locale === 'pt' ? 'clientes' : 'clientes'}`
          }
        </p>
      )}

      {/* ── Table ────────────────────────────────────────── */}
      <CustomersTable
        rows={filtered}
        locale={locale}
        onAddFirst={() => setModalOpen(true)}
      />

      {/* ── FAB — mobile Thumb Zone (above BottomBar) ─── */}
      <button
        onClick={() => setModalOpen(true)}
        aria-label="Nuevo cliente"
        className="sm:hidden fixed bottom-20 right-4 z-40 w-14 h-14 rounded-sm bg-[var(--color-spa-stone)] text-[var(--color-spa-bg)] flex items-center justify-center shadow-lg hover:opacity-90 transition-opacity"
      >
        <UserPlus size={20} strokeWidth={1.5} />
      </button>

      {/* ── Modal ────────────────────────────────────────── */}
      <AddCustomerModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}

// Re-export skeleton for Suspense fallback in page.tsx
export { CustomersTableSkeleton };
