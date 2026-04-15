/**
 * /dashboard/customers/[id]/routine — Generador de Rutina Home Care
 *
 * Server Component:
 *  - Resolves org + customer from headers/DB
 *  - Reads specialist identity from Supabase session
 *  - Passes all static data to HomeCareGenerator (Client)
 */

import { headers }                    from 'next/headers';
import { notFound }                   from 'next/navigation';
import Link                           from 'next/link';
import { ArrowLeft }                  from 'lucide-react';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getOrganizationBySlug }      from '@/domains/organizations/service';
import { getCustomerById }            from '@/domains/customers/service';
import { HomeCareGenerator }          from '@/domains/customers/components/HomeCareGenerator';

interface Props { params: Promise<{ id: string }> }

export default async function RoutinePage({ params }: Props) {
  const { id } = await params;
  const h      = await headers();
  const slug   = h.get('x-tenant-slug') ?? '';
  const locale = h.get('x-locale')      ?? 'es';

  // 1. Resolve organisation
  const orgResult = await getOrganizationBySlug(slug);
  if (!orgResult.data) notFound();
  const org = orgResult.data;

  // 2. Resolve customer (tenant-scoped)
  const custResult = await getCustomerById(org.id, id);
  if (!custResult.data) notFound();
  const customer = custResult.data;

  // 3. Specialist identity from session
  const supabase    = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const specialistName = user?.user_metadata?.full_name ?? user?.email ?? 'Especialista';

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Back link */}
      <Link
        href={`/dashboard/customers/${id}`}
        className="inline-flex items-center gap-1.5 font-sans text-xs text-[var(--color-spa-muted)] hover:text-[var(--color-spa-stone)] transition-colors"
      >
        <ArrowLeft size={12} strokeWidth={1.5} />
        {locale === 'en' ? 'Back to record' : locale === 'pt' ? 'Voltar ao expediente' : 'Volver al expediente'}
      </Link>

      {/* Heading */}
      <div className="space-y-0.5">
        <p className="font-sans text-[10px] uppercase tracking-[0.18em] text-[var(--color-spa-muted)]">
          {customer.fullName}
        </p>
        <h1 className="font-serif text-3xl font-light tracking-wide text-[var(--color-spa-stone)]">
          {locale === 'en' ? 'Home Care Routine' : locale === 'pt' ? 'Rotina Home Care' : 'Rutina Home Care'}
        </h1>
      </div>

      {/* Generator */}
      <HomeCareGenerator
        customerId={id}
        organizationId={org.id}
        customerName={customer.fullName}
        specialistName={specialistName}
        organizationName={org.name}
      />
    </div>
  );
}
