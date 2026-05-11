'use client';

import { useState, useMemo, useTransition } from 'react';
import { usePathname } from 'next/navigation';
import { Search, UserPlus, ChevronDown } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CustomerListItem, type CustomerSer } from './CustomerListItem';
import { ImportCustomersModal } from './ImportCustomersModal';
import { CustomerFormModal } from './CustomerFormModal';
import { exportCustomersAction } from '../actions/export-customers';

interface Props { customers: CustomerSer[]; locale: string; }

export function CustomersSidebar({ customers, locale }: Props) {
  const t        = useTranslations('dashboard.customers.sidebar');
  const tOptions = useTranslations('customers.options');
  const pathname = usePathname();
  const router   = useRouter();
  const [query,       setQuery]       = useState('');
  const [importOpen,  setImportOpen]  = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [optOpen,     setOptOpen]     = useState(false);
  const [exPending,   startExport]    = useTransition();

  const selectedId = useMemo(() => {
    const m = pathname.match(/\/customers\/([a-f0-9-]{36})/i);
    return m?.[1] ?? null;
  }, [pathname]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      c.fullName.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q) ||
      c.phone?.includes(q),
    );
  }, [customers, query]);

  function handleExport() {
    setOptOpen(false);
    startExport(async () => {
      const res = await exportCustomersAction();
      if (res.error) { toast.error(res.error.message); return; }
      const { csv, filename } = res.data!;
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), { href: url, download: filename });
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success(t('toastExported'));
    });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-spa-border shrink-0">
        <h2 className="font-serif text-xl font-light text-stone-900">{t('heading')}</h2>
        <div className="flex items-center gap-1">
          <button onClick={() => setAddOpen(true)}
            className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 transition-colors"
            aria-label={t('newClientAriaLabel')}>
            <UserPlus size={14} strokeWidth={1.5} />
          </button>

          {/* Options ▾ */}
          <Popover.Root open={optOpen} onOpenChange={setOptOpen}>
            <Popover.Trigger asChild>
              <button className="flex items-center gap-0.5 px-2 py-1 rounded-md hover:bg-stone-100 text-stone-500 font-sans text-xs transition-colors">
                {t('options')} <ChevronDown size={11} strokeWidth={1.5} className={`transition-transform duration-150 ${optOpen ? 'rotate-180' : ''}`} />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content align="end" sideOffset={4}
                className="z-50 w-48 bg-white rounded-sm shadow-lg border border-stone-100 py-1 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-150">
                <button onClick={() => { setOptOpen(false); setImportOpen(true); }}
                  className="w-full text-left px-3 py-2 font-sans text-sm text-stone-700 hover:bg-stone-50 transition-colors">
                  {tOptions('import')}
                </button>
                <div className="h-px bg-stone-100 mx-2 my-0.5" />
                <button onClick={handleExport} disabled={exPending}
                  className="w-full text-left px-3 py-2 font-sans text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-40 transition-colors">
                  {exPending ? '…' : tOptions('export')}
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 py-3 border-b border-spa-border shrink-0">
        <div className="relative">
          <Search size={13} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-8 pr-3 py-2 font-sans text-sm bg-stone-50 border border-stone-200 rounded-sm text-stone-700 placeholder:text-stone-400 focus:outline-none focus:border-stone-400 transition-colors"
          />
        </div>
      </div>

      {query && <p className="px-4 py-1.5 font-sans text-[11px] text-stone-400 shrink-0">{filtered.length} / {customers.length}</p>}

      {/* List */}
      <ul className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center">
            <p className="font-sans text-sm text-stone-400">{t('noClients')}</p>
          </li>
        ) : filtered.map((c) => (
          <li key={c.id} className="border-b border-stone-100 last:border-0">
            <CustomerListItem customer={c} locale={locale} isSelected={selectedId === c.id} />
          </li>
        ))}
      </ul>

      <ImportCustomersModal open={importOpen} onClose={() => setImportOpen(false)} locale={locale} />
      <CustomerFormModal
        mode="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        locale={locale}
        onSuccess={(newId) => { router.push(`/dashboard/customers/${newId}`); router.refresh(); }}
      />
    </div>
  );
}
