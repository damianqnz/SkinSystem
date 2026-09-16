import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Users,
  CreditCard,
  Network,
  Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href:  string;
  label: string;
  icon:  LucideIcon;
};

type NavKey = 'panel' | 'calendar' | 'services' | 'clients' | 'payments' | 'integrations' | 'settings';

const NAV_ITEMS: readonly { key: NavKey; href: string; icon: LucideIcon }[] = [
  { key: 'panel',        href: '/dashboard',              icon: LayoutDashboard },
  { key: 'calendar',     href: '/dashboard/calendar',     icon: CalendarDays    },
  { key: 'services',     href: '/dashboard/catalog',      icon: Sparkles        },
  { key: 'clients',      href: '/dashboard/customers',    icon: Users           },
  { key: 'payments',     href: '/dashboard/billing',      icon: CreditCard      },
  { key: 'integrations', href: '/dashboard/integrations', icon: Network         },
  { key: 'settings',     href: '/dashboard/settings',     icon: Settings2       },
];

export function getNavItems(t: (key: NavKey) => string): NavItem[] {
  return NAV_ITEMS.map(({ key, href, icon }) => ({ href, icon, label: t(key) }));
}

export function getBottomNavItems(t: (key: NavKey) => string): NavItem[] {
  return getNavItems(t).slice(0, 5);
}
