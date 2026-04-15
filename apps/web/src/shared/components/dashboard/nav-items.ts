import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  CreditCard,
  Settings2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export type NavItem = {
  href:  string;
  label: string;
  icon:  LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',          label: 'Overview',     icon: LayoutDashboard },
  { href: '/dashboard/agenda',   label: 'Agenda',       icon: CalendarDays    },
  { href: '/dashboard/clients',  label: 'Clientes',     icon: Users           },
  { href: '/dashboard/services', label: 'Catálogo',     icon: Sparkles        },
  { href: '/dashboard/billing',  label: 'Facturación',  icon: CreditCard      },
  { href: '/dashboard/settings', label: 'Ajustes',      icon: Settings2       },
];

/** Items visible in the mobile bottom bar (max 5). */
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);
