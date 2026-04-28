'use client';

import { useState }    from 'react';
import { ChevronDown } from 'lucide-react';

interface Props {
  id:           string;
  title:        string;
  defaultOpen?: boolean;
  children:     React.ReactNode;
}

export function AccordionSection({ id, title, defaultOpen = true, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between group"
      >
        <h2 className="text-xs font-medium text-stone-400 uppercase tracking-widest">
          {title}
        </h2>
        <ChevronDown
          size={13}
          className={`text-stone-400 group-hover:text-stone-600 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && <div className="space-y-4">{children}</div>}
    </section>
  );
}
