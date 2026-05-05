'use client';

import { useState, useTransition, useOptimistic } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { MoreHorizontal, UserPlus, Mail, Loader2, ShieldCheck, User, X, Clock } from 'lucide-react';
import { toast } from 'sonner';
import {
  inviteStaffAction,
  toggleMemberActiveAction,
  updateMemberRoleAction,
  cancelInvitationAction,
} from '../actions';
import { useSettingsT } from '../../_i18n';

export interface TeamMember {
  id:        string;
  fullName:  string | null;
  avatarUrl: string | null;
  role:      'super_admin' | 'owner' | 'staff';
  isActive:  boolean;
}

export interface PendingInvitation {
  id:        string;
  email:     string;
  role:      'super_admin' | 'owner' | 'staff';
  expiresAt: Date;
  createdAt: Date;
}

interface Props {
  initial: { members: TeamMember[]; invitations: PendingInvitation[] };
  currentUserId: string;
}

function Avatar({ name, url, size = 'md' }: { name: string | null; url: string | null; size?: 'md' | 'sm' }) {
  const dim = size === 'md' ? 'w-9 h-9 text-sm' : 'w-7 h-7 text-xs';
  const initials = (name ?? '?').split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  if (url) return <img src={url} alt={name ?? ''} className={`${dim} rounded-full object-cover shrink-0`} />;
  return (
    <div className={`${dim} rounded-full bg-amber-100 text-amber-700 font-medium flex items-center justify-center shrink-0`}>
      {initials}
    </div>
  );
}

function RoleBadge({ role, labels }: { role: 'super_admin' | 'owner' | 'staff'; labels: { owner: string; staff: string } }) {
  return role === 'owner'
    ? <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 rounded px-1.5 py-0.5 font-medium"><ShieldCheck size={10} />{labels.owner}</span>
    : <span className="inline-flex items-center gap-1 text-[10px] bg-stone-100 text-stone-500 rounded px-1.5 py-0.5 font-medium"><User size={10} />{labels.staff}</span>;
}

function MemberRow({ member, isSelf, onToggleActive, onChangeRole, labels }: {
  member: TeamMember; isSelf: boolean;
  onToggleActive: (id: string, v: boolean) => void;
  onChangeRole:   (id: string, role: 'staff' | 'owner') => void;
  labels: ReturnType<typeof useSettingsT>['team'];
}) {
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 ${!member.isActive ? 'opacity-50' : ''}`}>
      <Avatar name={member.fullName} url={member.avatarUrl} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-stone-800 truncate">
          {member.fullName ?? labels.noMembers.split(' ')[0]}
          {isSelf && <span className="ml-1.5 text-[10px] text-stone-400">{labels.you}</span>}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          <RoleBadge role={member.role} labels={{ owner: labels.roleOwner, staff: labels.roleStaff }} />
          {!member.isActive && <span className="text-[10px] text-rose-500 font-medium">{labels.inactive}</span>}
        </div>
      </div>

      {!isSelf && (
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-colors">
              <MoreHorizontal size={15} />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content className="z-50 min-w-[160px] rounded-xl bg-white border border-stone-100 shadow-lg p-1 text-sm" align="end" sideOffset={4}>
              {member.role === 'staff' ? (
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer outline-none" onSelect={() => onChangeRole(member.id, 'owner')}>
                  <ShieldCheck size={13} className="text-amber-500" />{labels.promoteToOwner}
                </DropdownMenu.Item>
              ) : (
                <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer outline-none" onSelect={() => onChangeRole(member.id, 'staff')}>
                  <User size={13} className="text-stone-400" />{labels.demoteToStaff}
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Separator className="my-1 h-px bg-stone-100" />
              <DropdownMenu.Item
                className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer outline-none ${member.isActive ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-700 hover:bg-emerald-50'}`}
                onSelect={() => onToggleActive(member.id, !member.isActive)}>
                {member.isActive ? labels.deactivate : labels.reactivate}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      )}
    </div>
  );
}

function InvitationRow({ inv, onCancel, labels }: {
  inv: PendingInvitation; onCancel: (id: string) => void;
  labels: ReturnType<typeof useSettingsT>['team'];
}) {
  const expired = inv.expiresAt < new Date();
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <div className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
        <Mail size={15} className="text-stone-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-700 truncate">{inv.email}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <RoleBadge role={inv.role} labels={{ owner: labels.roleOwner, staff: labels.roleStaff }} />
          {expired
            ? <span className="text-[10px] text-rose-500 font-medium flex items-center gap-0.5"><Clock size={9} />{labels.expired}</span>
            : <span className="text-[10px] text-stone-400">{labels.pending}</span>}
        </div>
      </div>
      <button onClick={() => onCancel(inv.id)} title={labels.cancelInvite}
        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
        <X size={14} />
      </button>
    </div>
  );
}

export function TeamSection({ initial, currentUserId }: Props) {
  const t = useSettingsT().team;
  const [members,     setMembers]     = useState<TeamMember[]>(initial.members);
  const [invitations, setInvitations] = useState<PendingInvitation[]>(initial.invitations);
  const [showInvite,  setShowInvite]  = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole,  setInviteRole]  = useState<'staff' | 'owner'>('staff');
  const [pending,     startTransition] = useTransition();

  function handleToggleActive(profileId: string, isActive: boolean) {
    setMembers((prev) => prev.map((m) => m.id === profileId ? { ...m, isActive } : m));
    startTransition(async () => {
      const res = await toggleMemberActiveAction(profileId, isActive);
      if (res.error) {
        toast.error(res.error.message);
        setMembers((prev) => prev.map((m) => m.id === profileId ? { ...m, isActive: !isActive } : m));
      } else {
        toast.success(isActive ? t.successReactivate : t.successDeactivate);
      }
    });
  }

  function handleChangeRole(profileId: string, role: 'staff' | 'owner') {
    setMembers((prev) => prev.map((m) => m.id === profileId ? { ...m, role } : m));
    startTransition(async () => {
      const res = await updateMemberRoleAction({ profileId, role });
      if (res.error) { toast.error(res.error.message); setMembers(initial.members); }
      else           { toast.success(t.successRoleUpdate); }
    });
  }

  function handleCancelInvite(invitationId: string) {
    setInvitations((prev) => prev.filter((i) => i.id !== invitationId));
    startTransition(async () => {
      const res = await cancelInvitationAction(invitationId);
      if (res.error) { toast.error(res.error.message); setInvitations(initial.invitations); }
      else           { toast.success(t.successInviteCancel); }
    });
  }

  function handleSendInvite() {
    startTransition(async () => {
      const res = await inviteStaffAction({ email: inviteEmail, role: inviteRole });
      if (res.error) { toast.error(res.error.message); return; }
      toast.success(t.successInviteSentPrefix + inviteEmail);
      setInviteEmail('');
      setShowInvite(false);
    });
  }

  return (
    <section id="equipa" className="space-y-6">
      <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">{t.membersTitle}</h2>

      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
        {members.length === 0 ? (
          <p className="text-sm text-stone-400 text-center py-8">{t.noMembers}</p>
        ) : (
          members.map((m, idx) => (
            <div key={m.id} className={idx < members.length - 1 ? 'border-b border-stone-50' : ''}>
              <MemberRow member={m} isSelf={m.id === currentUserId} labels={t}
                onToggleActive={handleToggleActive} onChangeRole={handleChangeRole} />
            </div>
          ))
        )}
      </div>

      {invitations.length > 0 && (
        <>
          <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">{t.pendingInvites}</h2>
          <div className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden">
            {invitations.map((inv, idx) => (
              <div key={inv.id} className={idx < invitations.length - 1 ? 'border-b border-stone-50' : ''}>
                <InvitationRow inv={inv} onCancel={handleCancelInvite} labels={t} />
              </div>
            ))}
          </div>
        </>
      )}

      {showInvite ? (
        <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-4">
          <p className="text-sm font-medium text-stone-800">{t.inviteMember}</p>
          <div className="flex gap-3">
            <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="flex-1 border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-colors"
              onKeyDown={(e) => e.key === 'Enter' && handleSendInvite()} />
            <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as 'staff' | 'owner')}
              className="border border-stone-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:border-amber-300 transition-colors appearance-none">
              <option value="staff">{t.roleStaff}</option>
              <option value="owner">{t.roleOwner}</option>
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowInvite(false); setInviteEmail(''); }}
              className="px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-xl transition-colors">
              {t.cancel}
            </button>
            <button onClick={handleSendInvite} disabled={pending || !inviteEmail}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 disabled:opacity-60 transition-colors">
              {pending && <Loader2 size={13} className="animate-spin" />}
              {t.sendInvite}
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowInvite(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-700 hover:bg-stone-50 transition-colors">
          <UserPlus size={15} />{t.inviteMember}
        </button>
      )}
    </section>
  );
}
