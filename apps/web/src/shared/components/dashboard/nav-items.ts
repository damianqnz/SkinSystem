import {
  LayoutDashboard,
  CalendarDays,
  CalendarCheck2,
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
  { href: '/calendar',           label: 'Disponibilidad', icon: CalendarCheck2 },
  { href: '/dashboard/clients',  label: 'Clientes',     icon: Users           },
  { href: '/catalog',            label: 'Catálogo',     icon: Sparkles        },
  { href: '/dashboard/billing',  label: 'Facturación',  icon: CreditCard      },
  { href: '/dashboard/settings', label: 'Ajustes',      icon: Settings2       },
];

/** Items visible in the mobile bottom bar (max 5). */
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);
