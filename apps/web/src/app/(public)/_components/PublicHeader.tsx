'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu, type PublicSessionUser } from './UserMenu';

// ── Types ─────────────────────────────────────────────────────

interface Props {
  orgName: string;
  logoUrl: string | null;
  locale: string;
  user: PublicSessionUser | null;
}

const SECTIONS = [
  { id: 'servicos', label: { pt: 'Serviços', es: 'Servicios', en: 'Services' } },
  { id: 'sobre', label: { pt: 'Sobre nós', es: 'Sobre mí', en: 'About' } },
  { id: 'galeria', label: { pt: 'Galeria', es: 'Galería', en: 'Gallery' } },
  { id: 'avaliacoes', label: { pt: 'Avaliações', es: 'Reseñas', en: 'Reviews' } },
  { id: 'morada', label: { pt: 'Morada', es: 'Ubicación', en: 'Location' } },
] as const;

const BOOK_LABEL = { pt: 'Reservar', es: 'Reservar', en: 'Book now' } as const;

// ── Component ─────────────────────────────────────────────────

export function PublicHeader({ orgName, logoUrl, locale, user }: Props) {
  const [activeId, setActiveId] = useState<string>('');
  const [scrolled, setScrolled] = useState(false);

  const lang = (locale as 'pt' | 'es' | 'en') in { pt: 1, es: 1, en: 1 }
    ? (locale as 'pt' | 'es' | 'en')
    : 'pt';

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: '-20% 0px -70% 0px', threshold: 0 },
    );

    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header
      className={[
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/90 dark:bg-stone-950/90 backdrop-blur-md border-b border-stone-100 dark:border-stone-800'
          : 'bg-transparent',
      ].join(' ')}
    >
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-6">

        {/* Logo / Brand */}
        <div className="flex items-center shrink-0">
          {logoUrl ? (
            <Image
              src={logoUrl} alt={orgName}
              width={50} height={50}
              className="rounded-full object-cover"
            />
          ) : (
            <span className={[
              'font-cormorant text-lg font-semibold hidden sm:block transition-opacity duration-300',
              scrolled ? 'opacity-100 text-stone-900 dark:text-stone-100' : 'opacity-0',
            ].join(' ')}>
              {orgName}
            </span>
          )}
        </div>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-1">
          {SECTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => scrollTo(id)}
              className={[
                'px-3 py-1.5 rounded-lg text-[13px] font-outfit font-medium transition-colors',
                activeId === id
                  ? 'text-stone-900 dark:text-stone-100 bg-stone-100 dark:bg-stone-800'
                  : scrolled
                    ? 'text-stone-500 dark:text-stone-400 hover:text-stone-900 dark:hover:text-stone-100'
                    : 'text-white/70 hover:text-white',
              ].join(' ')}
            >
              {label[lang]}
            </button>
          ))}
        </nav>

        {/* Right cluster: language selector + user menu + CTA */}
        <div className="flex items-center gap-2 shrink-0">
          <LanguageSwitcher current={lang} scrolled={scrolled} />
          <UserMenu user={user} locale={lang} scrolled={scrolled} />

          <Link
            href="/book"
            className="px-4 py-2 text-stone-950 text-[13px] font-outfit font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'var(--brand-color)', borderRadius: 'var(--btn-radius)' }}
          >
            {BOOK_LABEL[lang]}
          </Link>
        </div>
      </div>
    </header>
  );
}
