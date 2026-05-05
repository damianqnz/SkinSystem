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

type NavTuple = readonly [string, string, string, string, string, string, string];

const NAV_LABELS: Record<'pt' | 'es' | 'en', NavTuple> = {
  pt: ['Panel', 'Calendário',  'Serviços',    'Clientes', 'Pagamentos', 'Integrações',   'Definições'    ],
  es: ['Panel', 'Calendario',  'Servicios',   'Clientes', 'Pagos',      'Integraciones', 'Configuración' ],
  en: ['Panel', 'Calendar',    'Services',    'Clients',  'Payments',   'Integrations',  'Settings'      ],
};

function resolveLocale(locale: string): 'pt' | 'es' | 'en' {
  return (locale === 'es' || locale === 'en') ? locale : 'pt';
}

export function getNavItems(locale: string): NavItem[] {
  const [panel, calendar, services, clients, payments, integrations, settings] =
    NAV_LABELS[resolveLocale(locale)];

  return [
    { href: '/dashboard',              label: panel,        icon: LayoutDashboard },
    { href: '/dashboard/calendar',     label: calendar,     icon: CalendarDays    },
    { href: '/dashboard/catalog',      label: services,     icon: Sparkles        },
    { href: '/dashboard/customers',    label: clients,      icon: Users           },
    { href: '/dashboard/billing',      label: payments,     icon: CreditCard      },
    { href: '/dashboard/integrations', label: integrations, icon: Network         },
    { href: '/dashboard/settings',     label: settings,     icon: Settings2       },
  ];
}

export function getBottomNavItems(locale: string): NavItem[] {
  return getNavItems(locale).slice(0, 5);
}
