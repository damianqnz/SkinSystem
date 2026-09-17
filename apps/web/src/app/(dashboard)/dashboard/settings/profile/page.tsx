import { headers }                    from 'next/headers';
import { notFound }                   from 'next/navigation';
import { eq }                         from 'drizzle-orm';
import { getTranslations }            from 'next-intl/server';
import { DEFAULT_LOCALE }             from '@/i18n/config';
import { db }                         from '@/infrastructure/db';
import { profiles }                   from '@/infrastructure/db/schema/organizations';
import { resolveTenantOrgId }         from '@/shared/lib/resolve-tenant-org-id';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { ProfileForm } from './_components/ProfileForm';

export default async function ProfileSettingsPage() {
  const hdrs   = await headers();
  const locale = hdrs.get('x-locale') ?? DEFAULT_LOCALE;
  const t      = await getTranslations({ locale, namespace: 'dashboard.settings.profile' });

  const auth = await resolveTenantOrgId();
  if ('error' in auth) notFound();

  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) notFound();

  const rows = await db
    .select({ fullName: profiles.fullName, phone: profiles.phone, avatarUrl: profiles.avatarUrl })
    .from(profiles)
    .where(eq(profiles.id, auth.userId))
    .limit(1);
  const profile = rows[0];
  if (!profile) notFound();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('title')}</h1>
        <p className="text-sm text-stone-400 mt-1">{t('description')}</p>
      </div>

      <ProfileForm
        email={user.email}
        initial={{
          fullName:  profile.fullName ?? '',
          phone:     profile.phone    ?? '',
          avatarUrl: profile.avatarUrl,
        }}
      />
    </div>
  );
}
