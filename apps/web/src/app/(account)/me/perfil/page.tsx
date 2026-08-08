import { redirect }     from 'next/navigation';
import { headers }      from 'next/headers';
import { getOrganizationBySlug }      from '@/domains/organizations/service';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { getMyCustomer }              from '@/domains/customers/service-me';
import { ProfileForm } from '../_components/ProfileForm';

export default async function PerfilPage() {
  const hdrs = await headers();
  const slug = hdrs.get('x-tenant-slug') ?? '';

  // El `/me/layout.tsx` ya hace auth-guard contra `/login`; estas
  // comprobaciones son defense-in-depth por si alguien renderiza esta
  // page fuera del layout esperado.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) redirect('/login?next=/me/perfil');

  const orgResult = await getOrganizationBySlug(slug);
  if (orgResult.error || !orgResult.data) redirect('/');

  const customerResult = await getMyCustomer(orgResult.data.id, user.email);
  const customer = customerResult.data;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cormorant text-xl font-semibold text-stone-900">Mis datos</h2>
        <p className="text-xs text-stone-400 mt-0.5 font-outfit">
          Esta información se utiliza para gestionar tus citas.
        </p>
      </div>

      {/* Email — read-only from Supabase auth */}
      <div>
        <label className="block text-xs font-outfit font-medium text-stone-500 mb-1.5">Email</label>
        <div className="w-full border border-stone-100 rounded-xl px-4 py-3 text-sm text-stone-400 bg-stone-50 font-outfit select-none">
          {user.email}
        </div>
        <p className="mt-1.5 text-[10px] text-stone-400 font-outfit">
          El email no puede modificarse desde aquí.
        </p>
      </div>

      <ProfileForm
        initialName={customer?.fullName ?? (user.user_metadata?.full_name as string) ?? ''}
        initialPhone={customer?.phone ?? ''}
      />
    </div>
  );
}
