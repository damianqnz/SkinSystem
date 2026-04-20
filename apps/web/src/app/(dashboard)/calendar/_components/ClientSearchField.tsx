'use client';

import { useState, useTransition, useRef } from 'react';
import { User } from 'lucide-react';
import { searchCustomersAction } from '../actions/search-customers';
import type { CustomerMatch } from '../actions/search-customers';

interface Props {
  value:    CustomerMatch | null;
  onChange: (c: CustomerMatch | null) => void;
  onAddNew: () => void;
}

export function ClientSearchField({ value, onChange, onAddNew }: Props) {
  const [query,      setQuery]     = useState(value?.fullName ?? '');
  const [results,    setResults]   = useState<CustomerMatch[]>([]);
  const [showPanel,  setShowPanel] = useState(false);
  const [isPending,  startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    onChange(null); // clear parent selection while typing

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (v.length < 2) { setShowPanel(false); return; }

    debounceRef.current = setTimeout(() => {
      startTransition(async () => {
        const res = await searchCustomersAction(v);
        setResults(res.data ?? []);
        setShowPanel(true);
      });
    }, 300);
  }

  function handleSelect(c: CustomerMatch) {
    onChange(c);
    setQuery(c.fullName);
    setShowPanel(false);
  }

  const hasResults   = showPanel && results.length > 0;
  const showFallback = showPanel && !isPending && results.length === 0 && query.length > 2;

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10">
        <User size={14} className="text-stone-400" />
      </span>
      <input
        type="text"
        value={value ? value.fullName : query}
        onChange={handleChange}
        onFocus={() => { if (query.length >= 2 && !value) setShowPanel(true); }}
        onBlur={() => setTimeout(() => setShowPanel(false), 150)}
        placeholder="Buscar cliente..."
        autoComplete="off"
        aria-label="Buscar cliente"
        className="input-editorial w-full pl-8 text-sm"
      />

      {hasResults && (
        <ul className="absolute z-20 top-full left-0 right-0 bg-white border border-stone-200 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto no-scrollbar">
          {results.map((c) => (
            <li key={c.id}>
              <button type="button" onMouseDown={() => handleSelect(c)}
                className="w-full text-left px-3 py-2.5 text-sm hover:bg-stone-50 text-stone-800">
                <span className="font-medium">{c.fullName}</span>
                {c.email && <span className="ml-2 text-stone-400 text-xs">{c.email}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}

      {showFallback && (
        <div className="absolute z-20 top-full left-0 right-0 bg-white border border-stone-200 rounded-lg shadow-lg mt-1 p-3">
          <p className="text-xs text-stone-500 mb-2">No se encontró este cliente</p>
          <button type="button" onMouseDown={() => { setShowPanel(false); onAddNew(); }}
            className="text-sm border border-[#D4AF37] text-stone-800 rounded-lg px-3 py-1.5 hover:bg-[rgba(212,175,55,0.05)] transition-colors">
            ＋ Agregar cliente
          </button>
        </div>
      )}
    </div>
  );
}
