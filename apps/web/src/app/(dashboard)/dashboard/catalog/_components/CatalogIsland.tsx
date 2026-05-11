'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Pencil } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { ServiceRow } from './ServiceRow';
import { ServiceDrawer } from './ServiceDrawer';
import type { CategoryWithServices, ServiceRow as ServiceRowType } from '@/domains/catalog/service';

interface CatalogIslandProps {
  category:        CategoryWithServices | null;
  categories:      Pick<CategoryWithServices, 'id' | 'nameI18n'>[];
  locale:          string;
  organizationId:  string;
  onEditCategory?: () => void;
}

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

function resolveI18n(obj: unknown, locale: string): string {
  if (!obj || typeof obj !== 'object') return '';
  const o = obj as Record<string, string>;
  return o[locale] ?? o['es'] ?? o['en'] ?? Object.values(o)[0] ?? '';
}

export function CatalogIsland({ category, categories, locale, organizationId, onEditCategory }: CatalogIslandProps) {
  const t          = useTranslations('dashboard.catalog');
  const intlLocale = useLocale();
  const [expanded, setExpanded]             = useState(true);
  const [drawerOpen, setDrawerOpen]         = useState(false);
  const [editingService, setEditingService] = useState<ServiceRowType | null>(null);

  const services = category?.services ?? [];
  const catName  = category ? resolveI18n(category.nameI18n, intlLocale) : t('noCategory');
  const catDesc  = category ? resolveI18n(category.descriptionI18n, intlLocale) : '';
  const isOrphan = category === null;

  if (isOrphan && services.length === 0) return null;

  function openCreate() { setEditingService(null); setDrawerOpen(true); }
  function openEdit(svc: ServiceRowType) { setEditingService(svc); setDrawerOpen(true); }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28, ease: EASE }}
        className="bg-white rounded-2xl border border-stone-100 shadow-sm overflow-hidden"
      >
        {/* Header */}
        <div
          className="flex items-center gap-3 px-5 py-4 cursor-pointer select-none group"
          onClick={() => setExpanded((e) => !e)}
        >
          {!isOrphan && category?.isActive === false && (
            <span className="w-1.5 h-1.5 rounded-full bg-stone-300 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-cormorant text-[17px] font-semibold text-stone-800 leading-tight truncate">
              {catName}
            </h3>
            {catDesc && <p className="text-xs text-stone-400 mt-0.5 truncate">{catDesc}</p>}
          </div>

          <span className="text-[11px] font-medium text-stone-400 tabular-nums shrink-0">
            {services.length} {services.length === 1 ? t('serviceSingular') : t('servicePlural')}
          </span>

          {!isOrphan && onEditCategory && (
            <button
              onClick={(e) => { e.stopPropagation(); onEditCategory(); }}
              className="p-1.5 rounded-lg text-stone-300 hover:text-stone-600 hover:bg-stone-100 transition-colors opacity-0 group-hover:opacity-100"
              title={t('editCategoryTitle')}
            >
              <Pencil size={13} />
            </button>
          )}

          <motion.span
            animate={{ rotate: expanded ? 0 : -90 }}
            transition={{ duration: 0.18 }}
            className="text-stone-300 shrink-0"
          >
            <ChevronDown size={16} />
          </motion.span>
        </div>

        <div className="h-px bg-linear-to-r from-transparent via-amber-200/60 to-transparent mx-5" />

        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              key="content"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: EASE }}
              style={{ overflow: 'hidden' }}
            >
              {services.length === 0 ? (
                <div className="px-5 py-6 text-center">
                  <p className="text-sm text-stone-400">{t('emptyCategoryMsg')}</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-stone-50">
                      <th className="py-2 pl-4 pr-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest">{t('colService')}</th>
                      <th className="py-2 px-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest">{t('colPrice')}</th>
                      <th className="py-2 px-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest hidden sm:table-cell">{t('colDuration')}</th>
                      <th className="py-2 px-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest hidden md:table-cell">{t('colDeposit')}</th>
                      <th className="py-2 px-3 text-left text-[10px] font-medium text-stone-400 uppercase tracking-widest hidden sm:table-cell">{t('colStatus')}</th>
                      <th className="py-2 pl-3 pr-4" />
                    </tr>
                  </thead>
                  <tbody>
                    {services.map((svc, i) => (
                      <ServiceRow key={svc.id} service={svc} locale={locale} onEdit={openEdit} index={i} />
                    ))}
                  </tbody>
                </table>
              )}

              <div className="px-4 py-3 border-t border-stone-50">
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 text-xs text-stone-400 hover:text-amber-600 transition-colors group/add"
                >
                  <span className="w-5 h-5 rounded-full border border-stone-200 group-hover/add:border-amber-300 group-hover/add:bg-amber-50 flex items-center justify-center transition-colors">
                    <Plus size={10} />
                  </span>
                  {t('addService')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <ServiceDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingService(null); }}
        onSuccess={() => { setDrawerOpen(false); setEditingService(null); }}
        categories={categories}
        locale={locale}
        service={editingService}
        defaultCategoryId={category?.id ?? null}
        organizationId={organizationId}
      />
    </>
  );
}
