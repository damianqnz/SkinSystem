import { redirect }     from 'next/navigation';
import { headers }      from 'next/headers';
import Link             from 'next/link';
import { Calendar }     from 'lucide-react';
import { getOrganizationBySlug }      from '@/domains/organizations/service';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getMyCustomer, getMyAppointments } from '@/domains/customers/service-me';
import { AppointmentTabs } from './_components/AppointmentTabs';

export default async function CitasPage() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? 'es';

  // El `/me/layout.tsx` ya hace auth-guard contra `/login`; estas
  // comprobaciones son defense-in-depth por si alguien renderiza esta
  // page fuera del layout esperado.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login?next=/me/citas');

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) redirect('/');

  const customerResult = await getMyCustomer(orgResult.data.id, user.email);

  // No customer record yet — this user has never booked on this tenant
  if (!customerResult.data) {
    return (
      <div className="flex flex-col items-center justify-center py-14 gap-4">
        <Calendar size={32} className="text-stone-200" />
        <div className="text-center">
          <p className="font-outfit text-sm font-medium text-stone-500">Sin reservas futuras</p>
          <p className="text-xs text-stone-400 mt-1">¿Repetimos la experiencia?</p>
        </div>
        <Link
          href="/book"
          className="mt-1 px-5 py-2.5 text-xs font-outfit font-semibold rounded-xl transition-opacity hover:opacity-90"
          style={{ backgroundColor: 'var(--brand-color)', color: '#1c1917' }}
        >
          Hacer una reserva
        </Link>
      </div>
    );
  }

  const apptResult = await getMyAppointments(orgResult.data.id, customerResult.data.id);
  const all = apptResult.data ?? [];

  const now      = new Date();
  const upcoming = all.filter((a) =>
    new Date(a.startAt) >= now && a.status !== 'cancelled' && a.status !== 'no_show',
  );
  const past = all.filter((a) =>
    new Date(a.startAt) < now || a.status === 'cancelled' || a.status === 'no_show',
  );

  return <AppointmentTabs upcoming={upcoming} past={past} locale={locale} />;
}
