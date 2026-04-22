import { Suspense }  from 'react';
import { headers }   from 'next/headers';
import { LoginForm } from './_components/LoginForm';
import { authTranslations, detectAuthLocale, type AuthLocale } from '@/shared/lib/i18n/auth';

// Left panel is aria-hidden and purely decorative — always rendered in Spanish.
const ES = authTranslations['es'];

export const metadata = {
  title: 'SkinSystem — Acceso',
  description: 'Accede a tu espacio personal en SkinSystem.',
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

// ── Dynamic inner component ────────────────────────────────────────────────
// Reads searchParams and headers() — must live inside a <Suspense> so PPR
// can statically cache the outer shell while streaming this part.
async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params      = await searchParams;
  const next        = typeof params.next === 'string' ? params.next : undefined;
  const headersList = await headers();
  const locale: AuthLocale = detectAuthLocale(headersList.get('accept-language') ?? '');
  const t = authTranslations[locale];

  return (
    <>
      <div className="mb-12 text-center lg:hidden">
        <span className="font-serif text-sm tracking-[0.35em] uppercase text-stone-400">
          SkinSystem
        </span>
      </div>

      <header className="mb-10">
        <h1 className="font-serif text-[2.625rem] italic leading-[1.1] text-stone-900">
          {t.heading.split('\n').map((line, i) => (
            <span key={i} className="block">{line}</span>
          ))}
        </h1>
        <p className="mt-3 font-sans text-sm text-stone-500">{t.subtitle}</p>
        <div className="mt-5 h-px w-8 bg-stone-300" />
      </header>

      <LoginForm next={next} t={t} />
    </>
  );
}

// ── Page shell (statically cacheable) ─────────────────────────────────────
export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* ── Left panel (desktop only) — static / aria-hidden ──────── */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-stone-900 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14"
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />
        <span className="relative font-serif text-sm tracking-[0.35em] uppercase text-stone-500">
          SkinSystem
        </span>
        <div className="relative">
          <p className="font-serif text-[3rem] italic leading-[1.1] text-stone-100">
            {ES.tagline.split('. ').map((line, i, arr) => (
              <span key={i} className="block">
                {line}{i < arr.length - 1 ? '.' : ''}
              </span>
            ))}
          </p>
          <div className="mt-8 h-px w-14 bg-stone-700" />
        </div>
        <span className="relative font-sans text-[10px] tracking-[0.15em] uppercase text-stone-700">
          © 2026 SkinSystem · All rights reserved
        </span>
      </aside>

      {/* ── Right panel / mobile — streamed inside Suspense ───────── */}
      <main className="flex flex-col items-center justify-center bg-[#FAFAF9] px-6 py-16 sm:px-12">
        <div className="w-full max-w-[360px]">
          <Suspense fallback={
            <div className="space-y-6 animate-pulse">
              <div className="h-16 w-3/4 rounded bg-stone-200" />
              <div className="h-4 w-1/2 rounded bg-stone-100" />
              <div className="h-px w-8 bg-stone-200" />
              <div className="space-y-3">
                <div className="h-10 rounded bg-stone-100" />
                <div className="h-10 rounded bg-stone-100" />
                <div className="h-10 rounded bg-stone-900/20" />
              </div>
            </div>
          }>
            <LoginContent searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

    </div>
  );
}
