'use client';

import * as Popover from '@radix-ui/react-popover';
import { Plus, Phone, Mail, Globe, X as XIcon } from 'lucide-react';

export type FieldType =
  | 'instagram' | 'facebook' | 'x' | 'youtube' | 'linkedin' | 'tiktok'
  | 'website' | 'custom' | 'phone' | 'email';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
);
const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);
const YoutubeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22.54 6.42a2.78 2.78 0 00-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 001.46 6.42 29 29 0 001 12a29 29 0 00.46 5.58A2.78 2.78 0 003.41 19.6C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 001.95-1.95A29 29 0 0023 12a29 29 0 00-.46-5.58z"/><polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02"/>
  </svg>
);
const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/>
  </svg>
);
const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.79a8.18 8.18 0 004.78 1.52V6.85a4.85 4.85 0 01-1.01-.16z"/>
  </svg>
);

interface FieldOption { type: FieldType; label: string; icon: React.ReactNode }

const FIELD_OPTIONS: FieldOption[] = [
  { type: 'instagram', label: 'Instagram', icon: <InstagramIcon /> },
  { type: 'facebook',  label: 'Facebook',  icon: <FacebookIcon /> },
  { type: 'x',         label: 'X',         icon: <XIcon size={14} strokeWidth={1.5} /> },
  { type: 'youtube',   label: 'YouTube',   icon: <YoutubeIcon /> },
  { type: 'linkedin',  label: 'LinkedIn',  icon: <LinkedinIcon /> },
  { type: 'tiktok',    label: 'TikTok',    icon: <TikTokIcon /> },
  { type: 'website',   label: 'Sitio web', icon: <Globe size={14} strokeWidth={1.5} /> },
  { type: 'custom',    label: 'Custom',    icon: <Plus  size={14} strokeWidth={1.5} /> },
  { type: 'phone',     label: 'Teléfono',  icon: <Phone size={14} strokeWidth={1.5} /> },
  { type: 'email',     label: 'Email',     icon: <Mail  size={14} strokeWidth={1.5} /> },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSelect: (type: FieldType) => void;
  locale?: string;
}

export function AddFieldMenu({ open, onOpenChange, onSelect, locale }: Props) {
  const label = locale === 'pt' ? '+ Adicionar' : locale === 'en' ? '+ Add field' : '+ Agregar';

  return (
    <Popover.Root open={open} onOpenChange={onOpenChange}>
      <Popover.Trigger asChild>
        <button type="button"
          className="flex items-center gap-1.5 font-sans text-xs text-stone-500 hover:text-stone-800 transition-colors py-1 px-2 rounded-sm hover:bg-stone-100">
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content side="top" align="start" sideOffset={6}
          className="z-50 w-64 bg-white rounded-sm shadow-lg border border-stone-100 p-2 focus:outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:zoom-out-95 duration-150">
          <div className="grid grid-cols-3 gap-1">
            {FIELD_OPTIONS.map((opt) => (
              <button key={opt.type} type="button"
                onClick={() => { onSelect(opt.type); onOpenChange(false); }}
                className="flex flex-col items-center gap-1.5 p-2.5 rounded-sm hover:bg-stone-50 text-stone-600 hover:text-stone-900 transition-colors">
                {opt.icon}
                <span className="font-sans text-[10px] text-center leading-tight">{opt.label}</span>
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
