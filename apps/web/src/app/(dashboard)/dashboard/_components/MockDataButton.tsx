'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Database, Loader2 } from 'lucide-react';
import { seedTenantDataAction } from '../actions';

/**
 * Dev-only seeder trigger.
 * Renders nothing in production builds (NEXT_PUBLIC_NODE_ENV gate at runtime).
 * On click → wipes previous seed data and re-injects a fresh dataset.
 */
export function MockDataButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // Hide outside development
  if (process.env.NODE_ENV !== 'development') return null;

  const handleClick = () => {
    startTransition(async () => {
      const result = await seedTenantDataAction();
      if (result.status === 'success') {
        const { categories, services, customers, appointments, payments } = result.counts;
        toast.success(
          `Datos sembrados · ${categories} categorías · ${services} servicios · ${customers} clientes · ${appointments} citas · ${payments} pagos`,
          { description: result.removed > 0 ? `Se limpiaron ${result.removed} registros previos` : undefined },
        );
        router.refresh();
      } else if (result.status === 'error') {
        toast.error(result.message);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full
                 text-[11px] uppercase tracking-[0.12em]
                 border border-dashed border-[#D4AF37]/50
                 text-(--color-spa-stone) bg-[rgba(212,175,55,0.04)]
                 hover:bg-[rgba(212,175,55,0.10)] transition-colors duration-150
                 disabled:opacity-60 disabled:cursor-wait"
      style={{ fontFamily: 'var(--font-sans)' }}
      aria-label="Cargar datos de prueba"
      title="DEV ONLY · Reinyecta datos de prueba para este tenant"
    >
      {pending ? (
        <Loader2 size={12} strokeWidth={1.5} className="animate-spin" />
      ) : (
        <Database size={12} strokeWidth={1.5} className="text-[#D4AF37]" />
      )}
      <span>{pending ? 'Sembrando…' : 'Mock data'}</span>
    </button>
  );
}
