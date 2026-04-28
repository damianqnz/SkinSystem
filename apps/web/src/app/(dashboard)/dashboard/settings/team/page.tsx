import { Suspense }                  from 'react';
import { headers }                   from 'next/headers';
import { notFound }                  from 'next/navigation';
import { eq, and, inArray }          from 'drizzle-orm';
import { getOrganizationBySlug }     from '@/domains/organizations/service';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { db }                        from '@/infrastructure/db';
import { profiles }                  from '@/infrastructure/db/schema/organizations';
import { organizationInvitations }   from '@/infrastructure/db/schema/calendar';
import { TeamSection }               from './_components/TeamSection';

export default async function TeamPage() {
  return (
    <Suspense fallback={<TeamSkeleton />}>
      <TeamContent />
    </Suspense>
  );
}

async function TeamContent() {
  const hdrs  = await headers();
  const slug  = hdrs.get('x-tenant-slug') ?? '';

  const [orgResult, supabase] = await Promise.all([
    getOrganizationBySlug(slug),
    createSupabaseServerClient(),
  ]);

  if (orgResult.error || !orgResult.data) notFound();
  const orgId = orgResult.data.id;

  const { data: { user } } = await supabase.auth.getUser();
  const currentUserId = user?.id ?? '';

  const [memberRows, inviteRows] = await Promise.all([
    db.select({
      id:        profiles.id,
      fullName:  profiles.fullName,
      avatarUrl: profiles.avatarUrl,
      role:      profiles.role,
      isActive:  profiles.isActive,
    })
    .from(profiles)
    .where(and(
      eq(profiles.organizationId, orgId),
      inArray(profiles.role, ['owner', 'staff']),
    )),

    db.select({
      id:        organizationInvitations.id,
      email:     organizationInvitations.email,
      role:      organizationInvitations.role,
      expiresAt: organizationInvitations.expiresAt,
      createdAt: organizationInvitations.createdAt,
    })
    .from(organizationInvitations)
    .where(and(
      eq(organizationInvitations.organizationId!, orgId),
      eq(organizationInvitations.status, 'pending'),
    )),
  ]);

  return (
    <div className="space-y-8">
      {/* Page heading */}
      <div>
        <h1 className="font-cormorant text-2xl font-semibold text-stone-800">Sua equipa</h1>
        <p className="text-sm text-stone-400 mt-1">
          Gerencie os membros da sua equipa e os seus acessos.
        </p>
      </div>

      <TeamSection
        initial={{
          members:     memberRows,
          invitations: inviteRows,
        }}
        currentUserId={currentUserId}
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
