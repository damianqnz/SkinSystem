import type { ReactNode } from 'react';
import Link              from 'next/link';
import { redirect }      from 'next/navigation';
import { headers }       from 'next/headers';
import { getOrganizationBySlug }      from '@/domains/organizations/service';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getMyCustomer }              from '@/domains/customers/service-me';
import { MeSidebar }                  from './_components/MeSidebar';
import { LanguageSwitcher }           from '../_components/LanguageSwitcher';

// ── i18n (static labels) ──────────────────────────────────────

type Locale = 'pt' | 'es' | 'en';

const BOOK_CTA: Record<Locale, string> = {
  pt: 'Reservar consulta →',
  es: 'Reservar cita →',
  en: 'Book appointment →',
};

function normalizeLocale(raw: string): Locale {
  if (raw === 'pt' || raw === 'es' || raw === 'en') return raw;
  return 'pt';
}

export default async function MeLayout({ children }: { children: ReactNode }) {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = normalizeLocale(hdrs.get('x-locale') ?? 'pt');

  // ── Auth guard ──────────────────────────────────────────────
  // Sin sesión → `/login` (gateway unificado de Fase 30). El `next=/me`
  // asegura que tras el sign-in el cliente vuelva aquí — el loginAction
  // ya valida el `next` contra el subdominio del tenant activo.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/me');

  // El proxy sólo inyecta `x-tenant-slug` para tenants existentes, así que
  // `org not found` aquí es una anomalía de infraestructura, no un caso
  // de usuario. Mandamos a la landing pública del tenant.
  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) redirect('/');

  // Name: prefer DB record → user_metadata → email prefix
  const customerResult = await getMyCustomer(orgResult.data.id, user.email ?? '');
  const dbName  = customerResult.data?.fullName;
  const metaName = (user.user_metadata?.full_name as string)
    ?? (user.user_metadata?.name as string)
    ?? null;
  const displayName = dbName ?? metaName ?? user.email?.split('@')[0] ?? 'Usuario';
  const email       = user.email ?? '';

  return (
    <div className="min-h-screen bg-stone-100/60">

      {/* Top nav ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-100">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <Link href="/" className="font-cormorant text-xl font-semibold text-stone-900">
            {orgResult.data.name}
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher current={locale} scrolled={true} />
            <Link
              href="/book"
              className="text-xs text-stone-400 font-outfit hover:text-stone-700 transition-colors"
            >
              {BOOK_CTA[locale]}
            </Link>
          </div>
        </div>
      </header>

      {/* 2-column layout ─────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex gap-5 items-start">

          {/* Left — profile sidebar */}
          <aside className="w-64 flex-shrink-0">
            <MeSidebar name={displayName} email={email} />
          </aside>

          {/* Right — page content */}
          <main className="flex-1 min-w-0 bg-white rounded-2xl border border-stone-100 shadow-sm p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
