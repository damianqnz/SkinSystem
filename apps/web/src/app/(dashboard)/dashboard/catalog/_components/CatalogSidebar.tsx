'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { resolveI18nField } from '@/i18n/resolve-i18n-field';
import type { CategoryWithServices } from '@/domains/catalog/catalog-read';

interface CatalogSidebarProps {
  categories:  Pick<CategoryWithServices, 'id' | 'nameI18n' | 'isPublic'>[];
  orphanCount: number;
}

/**
 * Category navigation at both sizes: a fixed rail from `md` up, and a
 * horizontal strip below it — a 208px rail would take over half of a 375px
 * viewport and squeeze the service table into what is left.
 */
export function CatalogSidebar({ categories, orphanCount }: CatalogSidebarProps) {
  const t            = useTranslations('dashboard.catalog');
  const intlLocale   = useLocale();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const selected     = searchParams.get('category');

  function hrefFor(categoryId: string | null): string {
    if (!categoryId) return pathname;
    const params = new URLSearchParams(searchParams.toString());
    params.set('category', categoryId);
    return `${pathname}?${params.toString()}`;
  }

  function isActive(categoryId: string | null): boolean {
    return categoryId ? selected === categoryId : !selected;
  }

  const items: { id: string | null; label: string; isPublic: boolean }[] = [
    { id: null, label: t('allCategories'), isPublic: true },
    ...categories.map((cat) => ({
      id:       cat.id,
      label:    resolveI18nField(cat.nameI18n, intlLocale),
      isPublic: cat.isPublic,
    })),
    ...(orphanCount > 0 ? [{ id: 'none', label: t('noCategory'), isPublic: true }] : []),
  ];

  return (
    <>
      {/* Rail — md and up */}
      <aside className="hidden md:flex w-52 shrink-0 flex-col border-r border-stone-100 bg-[#FAFAF9] py-5">
        <p className="px-4 pb-3 font-cormorant text-base font-semibold text-stone-800">{t('sidebarTitle')}</p>

        <nav className="px-2 space-y-0.5">
          {items.map((item) => (
            <Link
              key={item.id ?? 'all'}
              href={hrefFor(item.id)}
              aria-current={isActive(item.id) ? 'page' : undefined}
              className={[
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors',
                isActive(item.id)
                  ? 'bg-stone-100 text-stone-900 font-medium'
                  : 'text-stone-500 hover:bg-stone-50 hover:text-stone-800',
              ].join(' ')}
            >
              {!item.isPublic && (
                <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" title={t('categoryPublicHint')} />
              )}
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Strip — below md */}
      <nav
        aria-label={t('sidebarTitle')}
        className="md:hidden flex gap-2 overflow-x-auto px-4 pt-4 pb-1 border-b border-stone-100"
      >
        {items.map((item) => (
          <Link
            key={item.id ?? 'all'}
            href={hrefFor(item.id)}
            aria-current={isActive(item.id) ? 'page' : undefined}
            className={[
              'flex items-center gap-1.5 shrink-0 min-h-11 px-3 rounded-full border text-sm transition-colors',
              isActive(item.id)
                ? 'border-stone-900 bg-stone-900 text-white font-medium'
                : 'border-stone-200 text-stone-600 hover:bg-stone-50',
            ].join(' ')}
          >
            {!item.isPublic && <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />}
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
