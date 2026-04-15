import { headers } from 'next/headers';
import { LoginForm } from './_components/LoginForm';
import { authTranslations, detectAuthLocale, type AuthLocale } from '@/shared/lib/i18n/auth';

export const metadata = {
  title: 'SkinSystem — Acceso',
  description: 'Portal de acceso para especialistas de SkinSystem.',
};

interface LoginPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params      = await searchParams;
  const next        = typeof params.next === 'string' ? params.next : undefined;
  const headersList = await headers();
  const locale: AuthLocale = detectAuthLocale(headersList.get('accept-language') ?? '');
  const t = authTranslations[locale];

  return (
    /**
     * Layout grid:
     *   mobile  (< lg): single column, form centrada
     *   desktop (≥ lg): two columns — editorial dark panel | form panel
     */
    <div className="grid min-h-screen lg:grid-cols-2">

      {/* ═══════════════════════════════════════════════════════
          PANEL IZQUIERDO — solo desktop
          Dark editorial con dot-grid y quote
      ═══════════════════════════════════════════════════════ */}
      <aside
        aria-hidden="true"
        className="relative hidden overflow-hidden bg-stone-900 lg:flex lg:flex-col lg:justify-between lg:px-16 lg:py-14"
      >
        {/* Dot-grid pattern */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Brand */}
        <span className="relative font-serif text-sm tracking-[0.35em] uppercase text-stone-500">
          SkinSystem
        </span>

        {/* Editorial quote — centro del panel */}
        <div className="relative">
          <p className="font-serif text-[3rem] italic leading-[1.1] text-stone-100">
            {t.tagline.split('. ').map((line, i) => (
              <span key={i} className="block">
                {line}{i < t.tagline.split('. ').length - 1 ? '.' : ''}
              </span>
            ))}
          </p>
          <div className="mt-8 h-px w-14 bg-stone-700" />
        </div>

        {/* Footer */}
        <span className="relative font-sans text-[10px] tracking-[0.15em] uppercase text-stone-700">
          © {new Date().getFullYear()} SkinSystem · All rights reserved
        </span>
      </aside>

      {/* ═══════════════════════════════════════════════════════
          PANEL DERECHO / columna móvil
          Form centrada en el espacio disponible
      ═══════════════════════════════════════════════════════ */}
      <main className="flex flex-col items-center justify-center bg-[#FAFAF9] px-6 py-16 sm:px-12">
        <div className="w-full max-w-[360px]">

          {/* ── Brand (visible solo en mobile) ──────────────── */}
          <div className="mb-12 text-center lg:hidden">
            <span className="font-serif text-sm tracking-[0.35em] uppercase text-stone-400">
              SkinSystem
            </span>
          </div>

          {/* ── Heading ─────────────────────────────────────── */}
          <header className="mb-10">
            <h1 className="font-serif text-[2.625rem] italic leading-[1.1] text-stone-900">
              {t.heading.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>
            <p className="mt-3 font-sans text-sm text-stone-500">{t.subtitle}</p>
            {/* Accent line */}
            <div className="mt-5 h-px w-8 bg-stone-300" />
          </header>

          {/* ── Form ────────────────────────────────────────── */}
          <LoginForm next={next} t={t} />

        </div>
      </main>

    </div>
  );
}
