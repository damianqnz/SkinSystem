import { Users } from 'lucide-react';

interface Props {
  onAdd?: () => void;
  isFiltered?: boolean;
}

export function CustomerEmptyState({ onAdd, isFiltered }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-6 text-center">
      <div className="relative">
        <div className="w-16 h-16 rounded-sm border border-[var(--color-spa-border)] bg-white/60 backdrop-blur-md flex items-center justify-center shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <Users size={22} strokeWidth={1.5} className="text-[var(--color-spa-muted)]" />
        </div>
        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-[#D4AF37]" />
      </div>

      <div className="space-y-2 max-w-xs">
        <h3 className="font-serif text-xl font-light text-[var(--color-spa-stone)] leading-snug">
          {isFiltered ? 'Sin resultados' : 'Sin clientes aún'}
        </h3>
        <p className="font-sans text-sm text-[var(--color-spa-muted)] leading-relaxed">
          {isFiltered
            ? 'Prueba con otro nombre, email o teléfono.'
            : 'Añade tu primer cliente y empieza a construir tu historial de tratamientos.'}
        </p>
      </div>

      {!isFiltered && onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 shimmer-btn font-sans text-sm font-medium text-[var(--color-spa-stone)] border border-[var(--color-spa-stone)] rounded-sm hover:bg-[var(--color-spa-stone)] hover:text-[var(--color-spa-bg)] transition-colors duration-200"
        >
          <Users size={14} strokeWidth={1.5} />
          Añadir Primer Cliente
        </button>
      )}
    </div>
  );
}
