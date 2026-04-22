'use client';

import { useRouter }          from 'next/navigation';
import { useState }           from 'react';
import { Loader2, LogOut }    from 'lucide-react';
import { createSupabaseClient } from '@/infrastructure/supabase/client';

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    const supabase = createSupabaseClient();
    await supabase.auth.signOut();
    // Tras sign-out → landing pública del tenant (coherente con
    // el `UserMenu` de la navbar pública). /book es para INICIAR una
    // reserva, no es un fallback de "sin sesión".
    router.push('/');
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-700 transition-colors font-outfit disabled:opacity-60"
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : <LogOut size={14} />}
      Cerrar sesión
    </button>
  );
}
