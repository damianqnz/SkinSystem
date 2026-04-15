'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { CatalogIsland } from './CatalogIsland';
import { CategoryDrawer } from './CategoryDrawer';
import type { CategoryWithServices, ServiceRow } from '@/domains/catalog/service';

interface CatalogClientProps {
  categories:     CategoryWithServices[];
  orphans:        ServiceRow[];
  locale:         string;
  organizationId: string;
}

export function CatalogClient({
  categories, orphans, locale, organizationId,
}: CatalogClientProps) {
  const [catDrawerOpen, setCatDrawerOpen]   = useState(false);
  const [editingCat, setEditingCat]         = useState<CategoryWithServices | null>(null);

  const catShapes = categories.map((c) => ({ id: c.id, nameI18n: c.nameI18n }));

  return (
    <>
      {/* Page header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h1 className="font-cormorant text-2xl font-semibold text-stone-800">Catálogo</h1>
          <p className="text-sm text-stone-400 mt-1">
            {categories.length} categorías · {categories.reduce((n, c) => n + c.services.length, 0) + orphans.length} servicios
          </p>
        </div>

        <button
          onClick={() => { setEditingCat(null); setCatDrawerOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-200 text-sm text-stone-600 hover:bg-stone-50 hover:border-stone-300 transition-colors"
        >
          <Plus size={14} />
          Nueva categoría
        </button>
      </div>

      {/* Data Islands */}
      <div className="space-y-4">
        {categories.length === 0 && orphans.length === 0 ? (
          <EmptyState onNewCategory={() => { setEditingCat(null); setCatDrawerOpen(true); }} />
        ) : (
          <>
            {categories.map((cat) => (
              <CatalogIsland
                key={cat.id}
                category={cat}
                categories={catShapes}
                locale={locale}
                organizationId={organizationId}
                onEditCategory={() => { setEditingCat(cat); setCatDrawerOpen(true); }}
              />
            ))}

            {/* Orphan island (services without category) */}
            <CatalogIsland
              category={null}
              categories={catShapes}
              locale={locale}
              organizationId={organizationId}
            />
          </>
        )}
      </div>

      {/* Category drawer */}
      <CategoryDrawer
        open={catDrawerOpen}
        onClose={() => { setCatDrawerOpen(false); setEditingCat(null); }}
        onSuccess={() => { setCatDrawerOpen(false); setEditingCat(null); }}
        category={editingCat}
      />
    </>
  );
}

function EmptyState({ onNewCategory }: { onNewCategory: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 rounded-2xl bg-stone-100 flex items-center justify-center mb-5">
        <span className="text-2xl">✦</span>
      </div>
      <h3 className="font-cormorant text-xl font-semibold text-stone-700 mb-2">
        Tu catálogo está vacío
      </h3>
      <p className="text-sm text-stone-400 max-w-xs mb-6">
        Crea categorías para organizar tus servicios y configura los precios y depósitos de cada uno.
      </p>
      <button
        onClick={onNewCategory}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white text-sm font-medium hover:bg-stone-800 transition-colors"
      >
        <Plus size={14} />
        Crear primera categoría
      </button>
    </div>
  );
}
