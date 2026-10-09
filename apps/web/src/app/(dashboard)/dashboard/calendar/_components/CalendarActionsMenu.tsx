'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { InviteMemberModal } from './InviteMemberModal';

interface CalendarActionsMenuProps {
  /** Owner/super_admin can invite team members; staff never see the option. */
  canManageTeam: boolean;
}

const ITEM_CLASS =
  'flex items-center gap-2 px-3 py-2 rounded-lg text-stone-700 outline-none cursor-pointer select-none ' +
  'hover:bg-stone-50 focus:bg-stone-50 data-[highlighted]:bg-stone-50';

export function CalendarActionsMenu({ canManageTeam }: CalendarActionsMenuProps) {
  const t            = useTranslations('dashboard.calendar.actionsMenu');
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [inviteOpen, setInviteOpen] = useState(false);

  /** Opens the appointment FAB via `?new=` on the current calendar URL,
   *  preserving every other param (view, date, staff, …). */
  const openNew = (value: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.set('new', value);
    router.push(`${pathname}?${sp.toString()}`);
  };

  return (
    <>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            aria-label={t('triggerAria')}
            className="p-1.5 rounded-md text-spa-muted hover:text-[#D4AF37] hover:bg-stone-50 transition-colors"
          >
            <Plus size={14} strokeWidth={1.5} />
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Portal>
          <DropdownMenu.Content
            align="end"
            sideOffset={4}
            className="z-50 min-w-[200px] rounded-xl bg-white border border-stone-100 shadow-lg p-1 text-sm"
          >
            <DropdownMenu.Item
              onSelect={() => openNew('appointment')}
              className={ITEM_CLASS}
            >
              {t('newAppointment')}
            </DropdownMenu.Item>

            {canManageTeam && (
              <DropdownMenu.Item
                onSelect={() => setInviteOpen(true)}
                className={ITEM_CLASS}
              >
                {t('addTeamMember')}
              </DropdownMenu.Item>
            )}

            <DropdownMenu.Item asChild>
              <Link href="/dashboard/catalog?new=service" className={ITEM_CLASS}>
                {t('createService')}
              </Link>
            </DropdownMenu.Item>

            <DropdownMenu.Item
              disabled
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-stone-400 outline-none cursor-not-allowed"
            >
              {t('addClient')}
              <Badge label={t('comingSoonBadge')} />
            </DropdownMenu.Item>

            <DropdownMenu.Item
              disabled
              className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-stone-400 outline-none cursor-not-allowed"
            >
              {t('createClass')}
              <Badge label={t('comingSoonBadge')} />
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>

      <InviteMemberModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}

/** Purely decorative "coming soon" marker — the disabled state is what matters. */
function Badge({ label }: { label: string }) {
  return (
    <span
      aria-hidden="true"
      className="px-1.5 py-0.5 rounded text-[10px] font-medium leading-none bg-amber-50 text-amber-700"
    >
      {label}
    </span>
  );
}
