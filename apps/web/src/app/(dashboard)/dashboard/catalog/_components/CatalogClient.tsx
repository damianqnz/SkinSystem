'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Plus, Search, ChevronDown } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { resolveI18nField } from '@/i18n/resolve-i18n-field';
import { CatalogSidebar } from './CatalogSidebar';
import { CatalogIsland } from './CatalogIsland';
import { CategoryDrawer } from './CategoryDrawer';
import { ServiceDrawer } from './ServiceDrawer';
import { RoomComingSoonModal } from './RoomComingSoonModal';
import type { CategoryWithServices, ServiceRow } from '@/domains/catalog/catalog-read';

interface CatalogClientProps {
  categories:     CategoryWithServices[];
  orphans:        ServiceRow[];
  organizationId: string;
}

export function CatalogClient({ categories, orphans, organizationId }: CatalogClientProps) {
  const t      = useTranslations('dashboard.catalog');
  const intlLocale = useLocale();
  const searchParams = useSearchParams();
  const selectedCategoryId = searchParams.get('category');

  const [catDrawerOpen, setCatDrawerOpen] = useState(false);
  const [editingCat, setEditingCat]       = useState<CategoryWithServices | null>(null);
  const [svcDrawerOpen, setSvcDrawerOpen] = useState(false);
  const [roomInfoOpen, setRoomInfoOpen]   = useState(false);
  const [search, setSearch]               = useState('');

  const catShapes = categories.map((c) => ({ id: c.id, nameI18n: c.nameI18n }));
  const term = search.trim().toLowerCase();

  const filteredCategories = useMemo<CategoryWithServices[]>(() => {
    if (!term) return categories;
    return categories
      .map((cat) => ({
        ...cat,
        services: cat.services.filter((svc) =>
          resolveI18nField(svc.nameI18n, intlLocale).toLowerCase().includes(term)
        ),
      }))
      .filter((cat) => cat.services.length > 0);
  }, [categories, term, intlLocale]);

  const filteredOrphans = useMemo<ServiceRow[]>(() => {
    if (!term) return orphans;
    return orphans.filter((svc) =>
      resolveI18nField(svc.nameI18n, intlLocale).toLowerCase().includes(term)
    );
  }, [orphans, term, intlLocale]);

  const visibleCategories = selectedCategoryId && selectedCategoryId !== 'none'
    ? filteredCategories.filter((c) => c.id === selectedCategoryId)
    : selectedCategoryId === 'none' ? [] : filteredCategories;
  const visibleOrphans = selectedCategoryId === 'none' ? filteredOrphans
    : selectedCategoryId ? [] : filteredOrphans;

  const totalServices = categories.reduce((n, c) => n + c.services.length, 0) + orphans.length;
  const isEmpty   = categories.length === 0 && orphans.length === 0;
  const noResults = !isEmpty && term.length > 0 && visibleCategories.length === 0 && visibleOrphans.length === 0;

  return (
    <div className="flex flex-col md:flex-row bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden min-h-[70vh]">
      <CatalogSidebar categories={categories} orphanCount={orphans.length} />

      <div className="flex-1 min-w-0 p-4 sm:p-8">
        {/* Page header */}
        <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="font-cormorant text-2xl font-semibold text-stone-800">{t('title')}</h1>
            <p className="text-sm text-stone-400 mt-1">
              {categories.length} {t('categoriesLabel')} · {totalServices} {t('servicesLabel')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!isEmpty && (
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="pl-8 pr-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-700
                             placeholder:text-stone-400 bg-white hover:border-stone-300
                             focus:outline-none focus:border-amber-300 focus:ring-1 focus:ring-amber-200
                             transition-colors w-44 sm:w-52"
                />
              </div>
            )}

            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors whitespace-nowrap">
                  <Plus size={14} />
                  {t('addMenuLabel')}
                  <ChevronDown size={12} className="text-stone-400" />
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  sideOffset={4}
                  className="z-50 min-w-[160px] rounded-xl bg-white border border-stone-100 shadow-lg p-1 text-sm"
                >
                  <DropdownMenu.Item
                    onSelect={() => setSvcDrawerOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer outline-none"
                  >
                    {t('addMenuService')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => { setEditingCat(null); setCatDrawerOpen(true); }}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer outline-none"
                  >
                    {t('addMenuCategory')}
                  </DropdownMenu.Item>
                  <DropdownMenu.Item
                    onSelect={() => setRoomInfoOpen(true)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-stone-700 hover:bg-stone-50 cursor-pointer outline-none"
                  >
                    {t('addMenuRoom')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>

        {/* Data Islands */}
        <div className="space-y-4">
          {isEmpty ? (
            <EmptyState t={t} onNewCategory={() => { setEditingCat(null); setCatDrawerOpen(true); }} />
          ) : noResults ? (
            <NoResults t={t} query={search} onClear={() => setSearch('')} />
          ) : (
            <>
              {visibleCategories.map((cat) => (
                <CatalogIsland
                  key={cat.id}
                  category={cat}
                  categories={catShapes}
                  organizationId={organizationId}
                  onEditCategory={() => { setEditingCat(cat); setCatDrawerOpen(true); }}
                />
              ))}
              {visibleOrphans.length > 0 && (
                <CatalogIsland
                  category={null}
                  categories={catShapes}
                  organizationId={organizationId}
                />
              )}
            </>
          )}
        </div>
      </div>

      <CategoryDrawer
        key={editingCat?.id ?? 'new'}
        open={catDrawerOpen}
        onClose={() => { setCatDrawerOpen(false); setEditingCat(null); }}
        onSuccess={() => { setCatDrawerOpen(false); setEditingCat(null); }}
        category={editingCat}
      />

      <ServiceDrawer
        key={svcDrawerOpen ? 'quick-add' : 'quick-add-closed'}
        open={svcDrawerOpen}
        onClose={() => setSvcDrawerOpen(false)}
        onSuccess={() => setSvcDrawerOpen(false)}
        categories={catShapes}
        service={null}
        defaultCategoryId={selectedCategoryId && selectedCategoryId !== 'none' ? selectedCategoryId : null}
        organizationId={organizationId}
      />

      <RoomComingSoonModal open={roomInfoOpen} onClose={() => setRoomInfoOpen(false)} />
    </div>
  );
}

type T = ReturnType<typeof useTranslations<'dashboard.catalog'>>;

function EmptyState({ t, onNewCategory }: { t: T; onNewCategory: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-5">
        <span className="text-2xl">✦</span>
      </div>
      <h3 className="font-cormorant text-xl font-semibold text-stone-700 mb-2">{t('emptyTitle')}</h3>
      <p className="text-sm text-stone-400 max-w-xs mb-6">{t('emptyDesc')}</p>
      <button
        onClick={onNewCategory}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
      >
        <Plus size={14} />
        {t('emptyButton')}
      </button>
    </div>
  );
}

function NoResults({ t, query, onClear }: { t: T; query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Search size={28} className="text-stone-300 mb-4" strokeWidth={1} />
      <p className="font-cormorant text-lg font-semibold text-stone-600 mb-1">
        {t('noResultsPrefix')}&ldquo;{query}&rdquo;
      </p>
      <p className="text-sm text-stone-400 mb-4">{t('noResultsDesc')}</p>
      <button
        onClick={onClear}
        className="text-xs text-amber-600 hover:text-amber-700 underline underline-offset-2 transition-colors"
      >
        {t('clearSearch')}
      </button>
    </div>
  );
}
