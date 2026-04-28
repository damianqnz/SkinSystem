'use client';

import { useState }           from 'react';
import Link                   from 'next/link';
import { usePathname }        from 'next/navigation';
import {
  ChevronDown, Store, User, Users, Sparkles, Settings2,
  Sliders, Star,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────

interface SubItem { label: string; anchor: string; }
interface Section {
  id:       string;
  label:    string;
  href:     string;
  icon:     React.ReactNode;
  children?: SubItem[];
}

// ── Nav config ────────────────────────────────────────────────

const BRAND_SECTIONS: SubItem[] = [
  { label: 'Detalhes da marca',   anchor: 'detalhes'     },
  { label: 'Aparência',           anchor: 'appearance'   },
  { label: 'Detalhes do contato', anchor: 'contato'      },
  { label: 'Localização',         anchor: 'localizacao'  },
  { label: 'Horário de trabalho', anchor: 'horario'      },
  { label: 'Seus links',          anchor: 'links'        },
];

const PREF_SECTIONS: SubItem[] = [
  { label: 'Políticas de reserva',        anchor: 'politicas'      },
  { label: 'Configuração de agendamento', anchor: 'config'         },
  { label: 'Personalização',             anchor: 'personalizacao' },
  { label: 'Visibilidade da página',      anchor: 'visibilidade'   },
];

const TOP_SECTIONS: Section[] = [
  { id: 'brand',    label: 'Sua marca',  href: '/dashboard/settings/brand',    icon: <Store size={14} />,    children: BRAND_SECTIONS },
  { id: 'profile',  label: 'Seu perfil', href: '/dashboard/settings/profile',  icon: <User size={14} />      },
  { id: 'team',     label: 'Sua equipa', href: '/dashboard/settings/team',     icon: <Users size={14} />     },
  { id: 'services', label: 'Serviços',   href: '/dashboard/catalog',           icon: <Sparkles size={14} />  },
  { id: 'general',  label: 'Geral',      href: '/dashboard/settings/general',  icon: <Settings2 size={14} /> },
];

const MANAGE_SECTIONS: Section[] = [
  { id: 'preferences', label: 'Preferências de agendamento', href: '/dashboard/settings/preferences', icon: <Sliders size={14} />, children: PREF_SECTIONS },
];

// ── Component ─────────────────────────────────────────────────

export function SettingsSidebar({ tenantSlug }: { tenantSlug: string }) {
  const path = usePathname();

  function isActive(href: string) {
    if (href === '/dashboard/settings/brand') return path.startsWith('/dashboard/settings/brand') || path === '/dashboard/settings';
    return path.startsWith(href);
  }

  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded]   = useState<Record<string, boolean>>({
    brand:       path.startsWith('/dashboard/settings/brand') || path === '/dashboard/settings',
    preferences: path.startsWith('/dashboard/settings/preferences'),
  });

  function toggle(id: string) {
    setExpanded((p) => ({ ...p, [id]: !p[id] }));
  }

  function renderSection(s: Section) {
    const active = isActive(s.href);
    const open   = expanded[s.id] ?? false;

    return (
      <div key={s.id}>
        <div className="flex items-center">
          <Link
            href={s.href}
            className={`flex flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors
              ${active
                ? 'bg-stone-100 text-stone-900 font-medium'
                : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800'}`}
          >
            <span className={active ? 'text-amber-600' : 'text-stone-400'}>{s.icon}</span>
            <span className="truncate">{s.label}</span>
          </Link>
          {s.children && (
            <button
              onClick={() => toggle(s.id)}
              className="p-1.5 text-stone-400 hover:text-stone-600 transition-colors flex-shrink-0"
            >
              <ChevronDown
                size={13}
                className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {s.children && open && (
          <div className="ml-7 mt-0.5 space-y-0.5 border-l border-stone-100 pl-3">
            {s.children.map((sub) => (
              <Link
                key={sub.anchor}
                href={`${s.href}#${sub.anchor}`}
                className="block py-1.5 text-xs text-stone-500 hover:text-stone-800 transition-colors"
              >
                {sub.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── Collapsed rail ─────────────────────────────────────────────
  if (collapsed) {
    return (
      <aside className="w-10 flex-shrink-0 flex flex-col h-full border-r border-stone-100 bg-[#FAFAF9] ml-1 overflow-hidden transition-all duration-200">
        <div className="flex items-center justify-center pt-5 pb-3">
          <button
            onClick={() => setCollapsed(false)}
            title="Expandir menu"
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
          >
            <PanelLeftOpen size={15} />
          </button>
        </div>
      </aside>
    );
  }

  // ── Expanded ───────────────────────────────────────────────────
  return (
    <aside className="w-60 flex-shrink-0 flex flex-col h-full border-r border-stone-100 bg-[#FAFAF9] ml-1 overflow-y-auto transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between pl-4 pr-2 pt-5 pb-3">
        <p className="font-cormorant text-base font-semibold text-stone-800">Definições</p>
        <button
          onClick={() => setCollapsed(true)}
          title="Recolher menu"
          className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
        >
          <PanelLeftClose size={14} />
        </button>
      </div>

      {/* Top nav */}
      <nav className="flex-1 px-2 space-y-0.5">
        {TOP_SECTIONS.map(renderSection)}

        {/* MANAGE divider */}
        <div className="pt-4 pb-1 px-2">
          <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-widest">Manage</p>
        </div>
        {MANAGE_SECTIONS.map(renderSection)}
      </nav>

      {/* Bottom utilities */}
      <div className="border-t border-stone-100 px-2 py-3 space-y-1">
        <Link href="/dashboard/settings/reviews"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-stone-500 hover:bg-stone-50 hover:text-stone-800 transition-colors">
          <Star size={13} />
          Avaliações
        </Link>
      </div>
    </aside>
  );
}
