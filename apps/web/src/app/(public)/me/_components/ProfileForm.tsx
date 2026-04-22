'use client';

import { useActionState, useEffect } from 'react';
import { Loader2, CheckCircle2 }     from 'lucide-react';
import { toast }                     from 'sonner';
import { updateProfileAction }       from '../actions';
import type { ProfileState }         from '../actions';

const IDLE: ProfileState = { status: 'idle' };

interface ProfileFormProps {
  initialName:  string;
  initialPhone: string;
}

export function ProfileForm({ initialName, initialPhone }: ProfileFormProps) {
  const [state, dispatch, isPending] =
    useActionState<ProfileState, unknown>(updateProfileAction, IDLE);

  useEffect(() => {
    if (state.status === 'success') toast.success('Perfil actualizado');
    if (state.status === 'error')   toast.error(state.message);
  }, [state]);

  const inputClass =
    'mt-1.5 w-full border border-stone-200 rounded-xl px-4 py-3 text-sm text-stone-900 bg-white ' +
    'focus:outline-none focus:ring-2 focus:ring-stone-900/20 focus:border-stone-400 ' +
    'placeholder:text-stone-300 transition-colors font-outfit';

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    (dispatch as (p: unknown) => void)({
      fullName: fd.get('fullName') as string,
      phone:    (fd.get('phone') as string) || '',
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-outfit text-stone-500 mb-0">Nombre completo</label>
        <input
          name="fullName"
          type="text"
          required
          minLength={2}
          maxLength={100}
          defaultValue={initialName}
          placeholder="Tu nombre"
          className={inputClass}
        />
      </div>

      <div>
        <label className="block text-xs font-outfit text-stone-500 mb-0">Teléfono</label>
        <input
          name="phone"
          type="tel"
          maxLength={30}
          defaultValue={initialPhone}
          placeholder="+34 600 000 000"
          className={inputClass}
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-outfit font-medium text-stone-950 rounded-xl hover:opacity-90 disabled:opacity-60 transition-opacity shadow-sm"
        style={{ backgroundColor: 'var(--brand-color)' }}
      >
        {isPending ? (
          <><Loader2 size={15} className="animate-spin" /> Guardando…</>
        ) : state.status === 'success' ? (
          <><CheckCircle2 size={15} /> Guardado</>
        ) : (
          'Guardar cambios'
        )}
      </button>
    </form>
  );
}
