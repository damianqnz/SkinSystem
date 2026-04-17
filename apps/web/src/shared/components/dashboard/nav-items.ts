import {
  LayoutDashboard,
  CalendarDays,
  Sparkles,
  Link2,
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

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',           label: 'Panel',        icon: LayoutDashboard },
  { href: '/dashboard/agenda',    label: 'Calendário',   icon: CalendarDays    },
  { href: '/catalog',             label: 'Serviços',     icon: Sparkles        },
  { href: '/calendar',            label: 'Conectar',     icon: Link2           },
  { href: '/dashboard/customers', label: 'Clientes',     icon: Users           },
  { href: '/dashboard/billing',   label: 'Pagamentos',   icon: CreditCard      },
  { href: '/dashboard/settings',  label: 'Integrações',  icon: Network         },
  { href: '/dashboard/settings',  label: 'Definições',   icon: Settings2       },
];

/** Items visible in the mobile bottom bar (max 5). */
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);
