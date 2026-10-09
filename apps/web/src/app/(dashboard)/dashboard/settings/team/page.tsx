import { Suspense }                  from 'react';
import { headers }                   from 'next/headers';
import { notFound }                  from 'next/navigation';
import { getTranslations }           from 'next-intl/server';
import { DEFAULT_LOCALE }            from '@/i18n/config';
import { getOrganizationBySlug }     from '@/domains/organizations/service';
import { listTeamMembers, listPendingInvitations } from '@/domains/organizations/team-service';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { resolveTenantOrgId }        from '@/shared/lib/resolve-tenant-org-id';
import { OWNER_ROLES }               from '@/shared/lib/resolve-tenant-types';
import { TeamSection }               from './_components/TeamSection';

export default async function TeamPage() {
  return (
    <Suspense fallback={<TeamSkeleton />}>
      <TeamContent />
    </Suspense>
  );
}

async function TeamContent() {
  const hdrs   = await headers();
  const slug   = hdrs.get('x-tenant-slug') ?? '';
  const locale = hdrs.get('x-locale') ?? DEFAULT_LOCALE;
  const t      = await getTranslations({ locale, namespace: 'dashboard.settings.team' });

  const [orgResult, supabase, manager] = await Promise.all([
    getOrganizationBySlug(slug),
    createSupabaseServerClient(),
    resolveTenantOrgId(OWNER_ROLES),
  ]);
  // Staff can see the team but not manage it; the actions enforce the same rule.
  const canManage = !('error' in manager);

  if (orgResult.error || !orgResult.data) notFound();
  const orgId = orgResult.data.id;

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const [membersResult, invitesResult] = await Promise.all([
    listTeamMembers(orgId),
    listPendingInvitations(orgId),
  ]);

  const memberRows = membersResult.data ?? [];
  const inviteRows = invitesResult.data ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('pageTitle')}</h1>
        <p className="text-sm text-stone-400 mt-1">{t('pageDescription')}</p>
      </div>

      <TeamSection
        initial={{ members: memberRows, invitations: inviteRows }}
        currentUserId={currentUserId}
        canManage={canManage}
      />
    </div>
  );
}

function TeamSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-40 bg-stone-100 rounded-lg" />
        <div className="h-4 w-72 bg-stone-100 rounded" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-36 bg-stone-100 rounded" />
        <div className="bg-stone-100 rounded-2xl h-36" />
      </div>
    </div>
  );
}
