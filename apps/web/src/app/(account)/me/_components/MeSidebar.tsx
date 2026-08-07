'use client';

import Link        from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, User, Sparkles } from 'lucide-react';
import { LogoutButton } from './LogoutButton';

// ── Nav items ─────────────────────────────────────────────────

const NAV = [
  { href: '/me/citas',            label: 'Mis citas',        icon: Calendar  },
  { href: '/me/perfil',           label: 'Mis datos',        icon: User      },
  { href: '/me/recomendaciones',  label: 'Recomendaciones',  icon: Sparkles  },
] as const;

// ── Avatar ────────────────────────────────────────────────────

function Avatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 text-white font-outfit font-semibold text-lg shadow-sm"
      style={{ backgroundColor: 'var(--brand-color)', color: '#1c1917' }}
      aria-label={name}
    >
      {initials || '?'}
    </div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────

interface MeSidebarProps {
  name:  string;
  email: string;
}

export function MeSidebar({ name, email }: MeSidebarProps) {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-5">

      {/* User card */}
      <div className="flex items-center gap-3">
        <Avatar name={name} />
        <div className="min-w-0">
          <p className="font-outfit font-semibold text-stone-900 text-sm leading-tight truncate">
            {name}
          </p>
          <p className="text-xs text-stone-400 truncate mt-0.5">{email}</p>
        </div>
      </div>

      <div className="border-t border-stone-100" />

      {/* Nav links */}
      <nav className="space-y-0.5">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-outfit transition-colors',
                active
                  ? 'bg-stone-100 text-stone-900 font-medium'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800',
              ].join(' ')}
            >
              <Icon size={16} className={active ? 'text-stone-700' : 'text-stone-400'} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-100" />

      {/* Logout */}
      <div className="px-1">
        <LogoutButton />
      </div>
    </div>
  );
}
