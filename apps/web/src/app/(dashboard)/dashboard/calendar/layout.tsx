import type { ReactNode } from 'react';
import { Suspense } from 'react';
import { headers } from 'next/headers';
import { CalendarsSidebar } from './_components/CalendarsSidebar';
import { resolveTenantOrgId } from '@/shared/lib/resolve-tenant-org-id';
import { OWNER_ROLES, type UserRole } from '@/shared/lib/resolve-tenant-types';
import { listTeamMembers, listPendingInvitations, type TeamMember } from '@/domains/organizations/team-service';

/** Plain-shape pending invitation — the sidebar only renders the email, so
 *  `expiresAt`/`createdAt` are projected away to keep the RSC prop contract narrow. */
type SidebarInvitation = { id: string; email: string };

/**
 * Agenda layout — adds a secondary collapsible sidebar to the right of the
 * primary nav. The header's tenantName is used as the local-calendar label.
 *
 * `headers()` is wrapped inside <Suspense> to satisfy Next 16 cacheComponents.
 */
async function AgendaShell({ children }: { children: ReactNode }) {
  const hdrs       = await headers();
  const tenantSlug = hdrs.get('x-tenant-slug') ?? '';
  const tenantName = tenantSlug
    ? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)
    : 'Estética';

  // The (dashboard) layout gate already authenticated the viewer; this second
  // resolve is request-scoped and role-aware. On any failure we degrade to
  // today's sidebar (tenant name only) rather than throwing or blanking.
  const auth = await resolveTenantOrgId();

  let viewer: { profileId: string; role: UserRole } | null = null;
  let members: TeamMember[] = [];
  let pendingInvitations: SidebarInvitation[] = [];
  let canManageTeam = false;

  if (!('error' in auth)) {
    viewer       = { profileId: auth.userId, role: auth.role };
    canManageTeam = OWNER_ROLES.includes(auth.role);

    // Only owner/super_admin get the team list + pending invitations;
    // a staff member never loads team data (they only see their own calendar).
    if (canManageTeam) {
      const [membersResult, invitesResult] = await Promise.all([
        listTeamMembers(auth.orgId),
        listPendingInvitations(auth.orgId),
      ]);
      members = membersResult.data ?? [];
      pendingInvitations = (invitesResult.data ?? []).map(({ id, email }) => ({ id, email }));
    }
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] -m-6">
      <CalendarsSidebar
        tenantName={tenantName}
        viewer={viewer}
        members={members}
        pendingInvitations={pendingInvitations}
        canManageTeam={canManageTeam}
      />
      <main className="flex-1 flex flex-col min-w-0 min-h-0 bg-(--color-spa-bg)">
        {children}
      </main>
    </div>
  );
}

export default function AgendaLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-[60vh]">
          <span className="w-5 h-5 rounded-full border-2 border-[#D4AF37] border-t-transparent animate-spin" />
        </div>
      }
    >
      <AgendaShell>{children}</AgendaShell>
    </Suspense>
  );
}
