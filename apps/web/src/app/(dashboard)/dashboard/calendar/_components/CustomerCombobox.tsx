'use client';

import { useMemo, useState, useTransition } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { ChevronDown, Plus, Search, User } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';
import { quickCreateCustomerAction } from '../actions';

export interface CustomerOption {
  id:       string;
  fullName: string;
  email:    string | null;
  phone:    string | null;
}

interface CustomerComboboxProps {
  options: CustomerOption[];
  value:   string | null;       // selected customer id
  onChange: (id: string, fullName: string) => void;
  /** Fired when the inline-create succeeds — orchestrator can prepend to its list. */
  onCreated?: (customer: CustomerOption) => void;
  label?:   string;
}

type Mode = 'list' | 'create';

export function CustomerCombobox({
  options,
  value,
  onChange,
  onCreated,
  label,
}: CustomerComboboxProps) {
  const [open, setOpen]   = useState(false);
  const [query, setQuery] = useState('');
  const [mode, setMode]   = useState<Mode>('list');

  // Inline-create form state
  const [name,  setName]  = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pending, startTransition] = useTransition();

  const selected = useMemo(
    () => options.find((c) => c.id === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) =>
      o.fullName.toLowerCase().includes(q) ||
      (o.email ?? '').toLowerCase().includes(q) ||
      (o.phone ?? '').toLowerCase().includes(q),
    );
  }, [query, options]);

  const reset = () => {
    setQuery('');
    setMode('list');
    setName(''); setPhone(''); setEmail('');
  };

  const submitCreate = () => {
    startTransition(async () => {
      const result = await quickCreateCustomerAction({
        fullName: name.trim(),
        phone:    phone.trim() || null,
        email:    email.trim() || null,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      const newOpt: CustomerOption = {
        id:       result.id,
        fullName: result.fullName,
        email:    email.trim() || null,
        phone:    phone.trim() || null,
      };
      onCreated?.(newOpt);
      onChange(newOpt.id, newOpt.fullName);
      toast.success(`${newOpt.fullName} adicionado`);
      reset();
      setOpen(false);
    });
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <span className="text-[10px] uppercase tracking-[0.14em] text-spa-muted"
              style={{ fontFamily: 'var(--font-sans)' }}>
          {label}
        </span>
      )}

      <Popover.Root open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-between w-full px-3 py-2 rounded-md',
              'text-[13px] tracking-wide',
              'border border-spa-border bg-white hover:bg-stone-50',
              'transition-colors data-[state=open]:border-stone-300',
            )}
            style={{ fontFamily: 'var(--font-sans)' }}
          >
            <span className="flex items-center gap-2 min-w-0">
              <User size={13} strokeWidth={1.5} className="text-spa-muted shrink-0" />
              <span className={cn('truncate', selected ? 'text-(--color-spa-stone)' : 'text-spa-muted')}>
                {selected?.fullName ?? 'Buscar ou criar cliente…'}
              </span>
            </span>
            <ChevronDown size={12} strokeWidth={1.5} className="text-spa-muted shrink-0" />
          </button>
        </Popover.Trigger>

        <Popover.Portal>
          <Popover.Content
            sideOffset={6}
            align="start"
            className={cn(
              'z-50 w-[320px] rounded-md border border-spa-border bg-white',
              'shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)] outline-none overflow-hidden',
              'data-[state=open]:animate-in data-[state=closed]:animate-out',
              'data-[state=open]:fade-in-0 data-[state=closed]:fade-out-0',
              'data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95',
            )}
          >
            {mode === 'list' ? (
              <div className="flex flex-col">
                {/* Search */}
                <div className="flex items-center gap-2 px-3 py-2 border-b border-spa-border">
                  <Search size={12} strokeWidth={1.5} className="text-spa-muted" />
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar por nome, email…"
                    className="flex-1 bg-transparent outline-none text-[13px] text-(--color-spa-stone) placeholder:text-spa-muted"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  />
                </div>

                {/* List */}
                <div className="max-h-[240px] overflow-y-auto no-scrollbar py-1">
                  {filtered.length === 0 && (
                    <p className="px-3 py-3 text-[12px] text-spa-muted text-center"
                       style={{ fontFamily: 'var(--font-sans)' }}>
                      Sem resultados
                    </p>
                  )}
                  {filtered.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => { onChange(c.id, c.fullName); setOpen(false); reset(); }}
                      className={cn(
                        'w-full text-left px-3 py-2 hover:bg-stone-50 transition-colors',
                        c.id === value && 'bg-stone-50',
                      )}
                    >
                      <p className="text-[13px] text-(--color-spa-stone) truncate"
                         style={{ fontFamily: 'var(--font-sans)' }}>
                        {c.fullName}
                      </p>
                      {(c.email || c.phone) && (
                        <p className="text-[11px] text-spa-muted truncate"
                           style={{ fontFamily: 'var(--font-sans)' }}>
                          {c.email ?? c.phone}
                        </p>
                      )}
                    </button>
                  ))}
                </div>

                {/* Footer — switch to create */}
                <button
                  type="button"
                  onClick={() => setMode('create')}
                  className="flex items-center gap-2 px-3 py-2 border-t border-spa-border
                             text-[12px] text-(--color-spa-stone) hover:bg-stone-50 transition-colors"
                  style={{ fontFamily: 'var(--font-sans)' }}
                >
                  <span className="w-5 h-5 rounded-md border border-dashed border-[#D4AF37]/60 flex items-center justify-center">
                    <Plus size={10} strokeWidth={1.5} className="text-[#D4AF37]" />
                  </span>
                  Novo cliente
                </button>
              </div>
            ) : (
              /* CREATE form */
              <div className="p-4 space-y-3">
                <p className="text-[12px] uppercase tracking-[0.14em] text-spa-muted"
                   style={{ fontFamily: 'var(--font-sans)' }}>
                  Novo cliente
                </p>
                <input
                  autoFocus
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome completo *"
                  className="input-editorial"
                />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Telefone"
                  className="input-editorial"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="input-editorial"
                />

                <div className="flex items-center justify-between gap-2 pt-2">
                  <button
                    type="button"
                    onClick={reset}
                    className="text-[12px] text-spa-muted hover:text-(--color-spa-stone)"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    ← Voltar
                  </button>
                  <button
                    type="button"
                    disabled={pending || name.trim().length < 2}
                    onClick={submitCreate}
                    className={cn(
                      'shimmer-btn px-3 py-1.5 rounded-md text-[12px] font-medium',
                      'bg-(--color-spa-stone) text-white hover:bg-stone-800',
                      'disabled:opacity-50 disabled:cursor-not-allowed transition-colors',
                    )}
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {pending ? 'A criar…' : 'Criar'}
                  </button>
                </div>
              </div>
            )}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
