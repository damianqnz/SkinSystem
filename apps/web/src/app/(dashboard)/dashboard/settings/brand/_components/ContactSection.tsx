'use client';

import { useState, useTransition, useRef, useEffect } from 'react';
import { Loader2, Plus, Phone, Mail, X } from 'lucide-react';
import { toast }                          from 'sonner';
import { updateContactAction }            from '../actions';

// ── Types ─────────────────────────────────────────────────────

interface ExtraContact {
  type:  'phone' | 'email';
  value: string;
  uid:   string; // stable local key
}

interface Props {
  initial: {
    primaryEmail:     string | null;
    primaryPhone:     string | null;
    additionalPhones: string[];
    additionalEmails: string[];
  };
}

// ── Helper ────────────────────────────────────────────────────

function notifyPreview() {
  if (typeof window !== 'undefined')
    window.dispatchEvent(new CustomEvent('skinsystem:settings-saved'));
}

// ── Component ─────────────────────────────────────────────────

export function ContactSection({ initial }: Props) {
  const [primaryEmail, setPrimaryEmail] = useState(initial.primaryEmail ?? '');
  const [primaryPhone, setPrimaryPhone] = useState(initial.primaryPhone ?? '');

  const counter = useRef(0);
  function uid() { return `c${counter.current++}`; }

  const [extras, setExtras] = useState<ExtraContact[]>(() => [
    ...initial.additionalPhones.map(v => ({ type: 'phone' as const, value: v, uid: uid() })),
    ...initial.additionalEmails.map(v => ({ type: 'email' as const, value: v, uid: uid() })),
  ]);

  const [dropOpen, setDropOpen]     = useState(false);
  const [isPending, startTransition] = useTransition();
  const dropRef                     = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropOpen) return;
    function outside(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node))
        setDropOpen(false);
    }
    document.addEventListener('mousedown', outside);
    return () => document.removeEventListener('mousedown', outside);
  }, [dropOpen]);

  function addExtra(type: 'phone' | 'email') {
    setExtras(p => [...p, { type, value: '', uid: uid() }]);
    setDropOpen(false);
  }

  function removeExtra(u: string) {
    setExtras(p => p.filter(c => c.uid !== u));
  }

  function updateExtra(u: string, value: string) {
    setExtras(p => p.map(c => c.uid === u ? { ...c, value } : c));
  }

  function handleSave() {
    startTransition(async () => {
      const res = await updateContactAction({
        primaryEmail:     primaryEmail  || null,
        primaryPhone:     primaryPhone  || null,
        additionalPhones: extras.filter(c => c.type === 'phone' && c.value.trim()).map(c => c.value.trim()),
        additionalEmails: extras.filter(c => c.type === 'email' && c.value.trim()).map(c => c.value.trim()),
      });

      if (res.error) { toast.error(res.error.message); return; }
      toast.success('Contacto guardado');
      notifyPreview();
    });
  }

  return (
    <section id="contato" className="bg-white rounded-2xl border border-stone-100 shadow-sm p-6 space-y-5">

      {/* Header */}
      <div>
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          Detalhes do contato
        </h2>
        <p className="text-sm text-stone-500 mt-1">
          Deixe os seus leads e clientes saberem como entrar em contato.
        </p>
      </div>

      {/* Primary email */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          Email primário
        </label>
        <input
          type="email"
          value={primaryEmail}
          onChange={e => setPrimaryEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
        />
      </div>

      {/* Primary phone */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-stone-500 uppercase tracking-wider">
          Telefone principal
        </label>
        <div className="flex items-center gap-2">
          <span className="text-sm text-stone-600 px-3 py-2.5 bg-stone-50 rounded-xl border border-stone-200 shrink-0">
            +351
          </span>
          <input
            type="tel"
            value={primaryPhone}
            onChange={e => setPrimaryPhone(e.target.value)}
            placeholder="912 345 678"
            className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
          />
        </div>
      </div>

      {/* Additional contacts */}
      {extras.length > 0 && (
        <div className="space-y-3">
          {extras.map(c => (
            <div key={c.uid} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-stone-500 uppercase tracking-wider flex items-center gap-1.5">
                  {c.type === 'phone'
                    ? <><Phone size={11} /><span>Telefone adicional</span></>
                    : <><Mail size={11} /><span>Email adicional</span></>
                  }
                </label>
                <button
                  onClick={() => removeExtra(c.uid)}
                  className="text-stone-300 hover:text-rose-400 transition-colors"
                  aria-label="Remover"
                >
                  <X size={14} />
                </button>
              </div>
              <input
                type={c.type === 'phone' ? 'tel' : 'email'}
                value={c.value}
                onChange={e => updateExtra(c.uid, e.target.value)}
                placeholder={c.type === 'phone' ? '912 345 678' : 'outro@email.com'}
                className="w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm text-stone-800 focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
              />
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar: "+ Add more" left, "Save" right */}
      <div className="flex items-center justify-between pt-1">

        {/* Dropdown trigger */}
        <div className="relative" ref={dropRef}>
          <button
            onClick={() => setDropOpen(v => !v)}
            className="inline-flex items-center gap-1 text-xs text-stone-400 hover:text-stone-700 transition-colors"
          >
            <Plus size={13} />
            Adicionar mais
          </button>

          {dropOpen && (
            <div className="absolute left-0 bottom-full mb-1.5 w-52 bg-white border border-stone-200 rounded-xl shadow-lg py-1 z-20">
              <button
                onClick={() => addExtra('phone')}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Phone size={14} className="text-stone-400" />
                Telefone adicional
              </button>
              <button
                onClick={() => addExtra('email')}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Mail size={14} className="text-stone-400" />
                Email adicional
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors"
        >
          {isPending && <Loader2 size={13} className="animate-spin" />}
          Guardar
        </button>
      </div>

    </section>
  );
}
