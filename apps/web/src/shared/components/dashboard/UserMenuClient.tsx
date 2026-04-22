'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter }                   from 'next/navigation';
import { LogOut }                      from 'lucide-react';
import { createSupabaseClient }        from '@/infrastructure/supabase/client';

interface UserMenuClientProps {
  initials:    string;
  displayName: string;
  email:       string;
}

/**
 * Client component — renders the user avatar and a logout dropdown.
 * Clicking the avatar toggles the dropdown; clicking outside closes it.
 */
export function UserMenuClient({ initials, displayName, email }: UserMenuClientProps) {
  const [open, setOpen]   = useState(false);
  const [loading, setLoading] = useState(false);
  const ref               = useRef<HTMLDivElement>(null);
  const router            = useRouter();

  // Close on outside click
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  async function handleSignOut() {
    setLoading(true);
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div ref={ref} className="relative">
      {/* Avatar button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 group focus:outline-none"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <div
          className="w-8 h-8 rounded-full bg-[var(--color-spa-stone)] text-white
                     flex items-center justify-center text-[11px] font-medium
                     group-hover:opacity-80 transition-opacity"
          aria-label={`Usuário: ${email}`}
        >
          {initials}
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-10 z-50 w-52
                     bg-white border border-stone-200 rounded-xl shadow-lg
                     overflow-hidden"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {/* User info header */}
          <div className="px-4 py-3 border-b border-stone-100">
            <p className="text-[12px] font-medium text-stone-800 truncate">{displayName}</p>
            <p className="text-[11px] text-stone-400 truncate">{email}</p>
          </div>

          {/* Sign out */}
          <button
            type="button"
            onClick={handleSignOut}
            disabled={loading}
            className="w-full flex items-center gap-2.5 px-4 py-2.5
                       text-[13px] text-red-600 hover:bg-red-50
                       transition-colors duration-150 disabled:opacity-50"
          >
            <LogOut size={14} />
            {loading ? 'Saindo…' : 'Cerrar sesión'}
          </button>
        </div>
      )}
    </div>
  );
}
