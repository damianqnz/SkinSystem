'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/shared/lib/utils';
import { ConnectCalendarModal } from './ConnectCalendarModal';
import { resolveCalendarStaff } from '@/domains/organizations/calendar-staff-policy';
import type { UserRole } from '@/shared/lib/resolve-tenant-types';

interface CalendarSource {
  id:    string;
  label: string;
  /** Hex tint for the dot (oro = local, otros = providers) */
  color: string;
  /** Display char for the avatar slot ("L" / "G" / "A" / "M") */
  badge: string;
  /** Provider name (rendered subtitle on Google etc.) */
  provider?: 'local' | 'google' | 'apple' | 'microsoft';
}

/** Serializable team member shape (mirrors `team-service` `TeamMember`). */
interface SidebarMember {
  id:        string;
  fullName:  string | null;
  avatarUrl: string | null;
  role:      UserRole;
  isActive:  boolean;
}

/** Serializable pending invitation — email only, Dates projected away upstream. */
interface SidebarInvitation {
  id:    string;
  email: string;
}

interface CalendarsSidebarProps {
  tenantName: string;
  /** ID of the calendar provider currently linked, e.g. 'lourdesmegusta@gmail.com' */
  linkedGoogleEmail?: string | null;
  /** Viewer identity resolved server-side; `null` when tenant resolution failed. */
  viewer: { profileId: string; role: UserRole } | null;
  members: SidebarMember[];
  pendingInvitations: SidebarInvitation[];
  /** Owner/super_admin only — gates the "Equipa" section. */
  canManageTeam: boolean;
}

/** Local-storage key — persists open/closed across navigation. */
const LS_KEY = 'agenda.sidebar.open';

export function CalendarsSidebar({
  tenantName,
  linkedGoogleEmail,
  viewer,
  members,
  pendingInvitations,
  canManageTeam,
}: CalendarsSidebarProps) {
  const t        = useTranslations('dashboard.calendar.sidebar');
  const pathname = usePathname();
  const params   = useSearchParams();

  // Hydrated lazily from localStorage — safe because reading it is synchronous
  // and this only runs once, during the initial client render (guarded for SSR
  // the same way the previous effect-based hydration was).
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return window.localStorage.getItem(LS_KEY) !== '0';
  });
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(LS_KEY, next ? '1' : '0');
      }
      return next;
    });
  };

  const sources: CalendarSource[] = [
    { id: 'tenant',  label: tenantName || t('localFallback'),  color: '#D4AF37', badge: tenantName?.[0]?.toUpperCase() ?? 'L', provider: 'local' },
    ...(linkedGoogleEmail
      ? [{ id: 'google', label: linkedGoogleEmail, color: '#4285F4', badge: 'G', provider: 'google' as const }]
      : []),
  ];

  // Initialise checks (default true) once sources resolve. `sources` is
  // rebuilt from `linkedGoogleEmail`/`tenantName`, which can arrive after
  // mount (e.g. once a Google account gets linked elsewhere), so this can't
  // be a lazy initializer — it must react to those props changing post-mount.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- adds default-checked entries for newly-appeared sources (e.g. Google linked after mount) while preserving existing selections
    setChecked((prev) => {
      const next = { ...prev };
      for (const s of sources) if (next[s.id] === undefined) next[s.id] = true;
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedGoogleEmail, tenantName]);

  // Effective selection — reuses the pure policy so the sidebar's display
  // always agrees with the server (the server stays authoritative for data).
  const requestedStaffId = params.get('staff');
  const activeMemberIds  = members.filter((m) => m.isActive).map((m) => m.id);
  const effectiveStaffId = viewer
    ? resolveCalendarStaff({ viewer, requestedStaffId, activeMemberIds })
    : null;
  const selectedMember = members.find((m) => m.id === effectiveStaffId) ?? null;
  const selectedName   = selectedMember?.fullName?.trim() || tenantName || t('localFallback');

  const buildMemberHref = (memberId: string) => {
    const sp = new URLSearchParams(Array.from(params.entries()));
    sp.set('staff', memberId);
    return `${pathname}${sp.toString() ? `?${sp.toString()}` : ''}`;
  };

  const teamMembers = members.filter((m) => m.isActive);
  const memberDisplayName = (m: SidebarMember) => m.fullName?.trim() || tenantName || t('localFallback');

  return (
    <AnimatePresence initial={false}>
      <motion.aside
        key="calendars-sidebar"
        initial={false}
        animate={{ width: open ? 288 : 36 }}
        transition={{ duration: 0.24, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hidden md:flex flex-col shrink-0 h-full
                   border-r border-spa-border bg-[#FAFAF9] overflow-hidden"
      >
        {/* ── Header w/ collapse toggle ─────────────────── */}
        <div className="flex items-center justify-between gap-2 h-12 px-3 border-b border-spa-border shrink-0">
          {open && (
            <h2
              className="text-[13px] tracking-wide text-(--color-spa-stone) truncate"
              style={{ fontFamily: 'var(--font-serif)' }}
            >
              {t('calendarOf', { name: selectedName })}
            </h2>
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={open ? t('collapseAria') : t('expandAria')}
            className="ml-auto p-1.5 rounded-md text-spa-muted hover:text-(--color-spa-stone) hover:bg-stone-100 transition-colors"
          >
            {open
              ? <ChevronLeft  size={14} strokeWidth={1.5} />
              : <ChevronRight size={14} strokeWidth={1.5} />}
          </button>
        </div>

        {/* ── Body — only when expanded ─────────────────── */}
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="body"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 0.08, duration: 0.18 } }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="flex-1 overflow-y-auto no-scrollbar px-3 py-3"
            >
              {/* Calendars section heading */}
              <h3
                className="px-2 py-1 text-[11px] font-medium uppercase tracking-widest text-spa-muted"
                style={{ fontFamily: 'var(--font-sans)' }}
              >
                {t('heading')}
              </h3>

              <div className="space-y-1">
                {sources.map((s) => (
                  <SourceRow
                    key={s.id}
                    source={s}
                    checked={checked[s.id] ?? true}
                    onToggle={() => setChecked((c) => ({ ...c, [s.id]: !(c[s.id] ?? true) }))}
                  />
                ))}

                {/* Connect new */}
                <ConnectCalendarModal>
                  <button
                    type="button"
                    className="group w-full flex items-center gap-2.5 px-2.5 py-2 mt-2
                           text-[12px] text-spa-muted hover:text-(--color-spa-stone)
                           rounded-md hover:bg-stone-100/70 transition-colors text-left"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    <span className="w-5 h-5 rounded-md border border-dashed border-spa-border flex items-center justify-center group-hover:border-[#D4AF37]">
                      <Plus size={10} strokeWidth={1.5} className="group-hover:text-[#D4AF37]" />
                    </span>
                    {t('connectCta')}
                  </button>
                </ConnectCalendarModal>
              </div>

              {/* Team section — owner/super_admin only */}
              {canManageTeam && (
                <>
                  <h3
                    className="mt-4 px-2 py-1 text-[11px] font-medium uppercase tracking-widest text-spa-muted"
                    style={{ fontFamily: 'var(--font-sans)' }}
                  >
                    {t('teamHeading')}
                  </h3>

                  <div className="space-y-1">
                    {teamMembers.map((m) => (
                      <MemberRow
                        key={m.id}
                        member={m}
                        isSelected={m.id === effectiveStaffId}
                        isSelf={viewer?.profileId === m.id}
                        href={buildMemberHref(m.id)}
                        ariaLabel={t('switchToMemberAria', { name: memberDisplayName(m) })}
                        youLabel={t('youBadge')}
                      />
                    ))}

                    {pendingInvitations.map((inv) => (
                      <InvitationRow key={inv.id} email={inv.email} pendingLabel={t('pendingInvitation')} />
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>
    </AnimatePresence>
  );
}

// ── Rows ──────────────────────────────────────────────────────────

function SourceRow({
  source,
  checked,
  onToggle,
}: {
  source:   CalendarSource;
  checked:  boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={cn(
        'flex items-center gap-2.5 px-2 py-1.5 rounded-md cursor-pointer',
        'hover:bg-stone-100/70 transition-colors',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="appearance-none w-3.5 h-3.5 rounded-sm border border-spa-border
                   checked:bg-(--color-spa-stone) checked:border-(--color-spa-stone)
                   relative
                   checked:after:content-['✓'] checked:after:text-white
                   checked:after:text-[9px] checked:after:absolute
                   checked:after:left-1/2 checked:after:top-1/2
                   checked:after:-translate-x-1/2 checked:after:-translate-y-1/2"
      />
      <span
        className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-medium text-white shrink-0"
        style={{ backgroundColor: source.color, fontFamily: 'var(--font-sans)' }}
        aria-hidden
      >
        {source.badge}
      </span>
      <span
        className="flex-1 min-w-0 truncate text-[12px] text-(--color-spa-stone)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {source.label}
      </span>
    </label>
  );
}

function MemberAvatar({ name, url }: { name: string | null; url: string | null }) {
  const source   = name?.trim() || '?';
  const initials = source.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
  if (url) {
    return (
      <Image
        src={url}
        alt={name ?? ''}
        width={20}
        height={20}
        className="w-5 h-5 rounded-full object-cover shrink-0"
      />
    );
  }
  return (
    <span
      className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[9px] font-medium shrink-0"
      style={{ fontFamily: 'var(--font-sans)' }}
      aria-hidden
    >
      {initials}
    </span>
  );
}

function MemberRow({
  member,
  isSelected,
  isSelf,
  href,
  ariaLabel,
  youLabel,
}: {
  member:     SidebarMember;
  isSelected: boolean;
  isSelf:     boolean;
  href:       string;
  ariaLabel:  string;
  youLabel:   string;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-label={ariaLabel}
      aria-current={isSelected ? 'true' : undefined}
      className={cn(
        'flex items-center gap-2.5 px-2 py-1.5 rounded-full transition-colors',
        isSelected ? 'bg-amber-50' : 'hover:bg-stone-100/70',
      )}
    >
      <MemberAvatar name={member.fullName} url={member.avatarUrl} />
      <span
        className="flex-1 min-w-0 truncate text-[12px] text-(--color-spa-stone)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {member.fullName ?? '—'}
      </span>
      {isSelf && (
        <span
          className="shrink-0 px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[9px] font-medium"
          style={{ fontFamily: 'var(--font-sans)' }}
        >
          {youLabel}
        </span>
      )}
    </Link>
  );
}

function InvitationRow({ email, pendingLabel }: { email: string; pendingLabel: string }) {
  return (
    <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-full opacity-70" aria-disabled>
      <span
        className="w-5 h-5 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center shrink-0"
        style={{ fontFamily: 'var(--font-sans)' }}
        aria-hidden
      >
        <Mail size={10} strokeWidth={1.5} />
      </span>
      <span
        className="flex-1 min-w-0 truncate text-[12px] text-(--color-spa-stone)"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {email}
      </span>
      <span
        className="shrink-0 px-1.5 py-0.5 rounded-full bg-stone-100 text-stone-500 text-[9px] font-medium"
        style={{ fontFamily: 'var(--font-sans)' }}
      >
        {pendingLabel}
      </span>
    </div>
  );
}
