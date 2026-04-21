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

export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard',            label: 'Panel',        icon: LayoutDashboard },
  { href: '/dashboard/calendar',   label: 'Calendário',   icon: CalendarDays    },
  { href: '/dashboard/catalog',    label: 'Serviços',     icon: Sparkles        },
  { href: '/dashboard/customers',  label: 'Clientes',     icon: Users           },
  { href: '/dashboard/billing',    label: 'Pagamentos',   icon: CreditCard      },
  { href: '/dashboard/integrations', label: 'Integrações',  icon: Network         },
  { href: '/dashboard/settings',    label: 'Definições',   icon: Settings2       },
];

/** Items visible in the mobile bottom bar (max 5). */
export const BOTTOM_NAV_ITEMS = NAV_ITEMS.slice(0, 5);
