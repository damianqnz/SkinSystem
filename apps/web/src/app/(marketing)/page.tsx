/**
 * @file (marketing)/page.tsx
 * @description Placeholder SaaS landing on the apex domain.
 *
 * Intentionally minimal: this group exists right now to give the apex a real
 * `/` so it stops resolving to the tenant site. The actual landing lands in a
 * later phase.
 */

import type { Metadata }   from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('marketing.landing');
  return { title: t('title'), description: t('tagline') };
}

export default async function MarketingPage() {
  const t = await getTranslations('marketing.landing');

  return (
    // Typography comes from the layout: `outfit.variable` binds `--font-sans`,
    // which `globals.css` already applies to `body`. No font class needed here.
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-medium tracking-tight sm:text-4xl">
        {t('title')}
      </h1>
      <p className="max-w-md text-sm text-stone-400">
        {t('tagline')}
      </p>
      <span className="mt-2 rounded-full border border-stone-800 px-3 py-1 text-xs text-stone-400">
        {t('status')}
      </span>
    </main>
  );
}
