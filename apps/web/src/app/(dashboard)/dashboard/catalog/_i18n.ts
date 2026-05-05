import { useTenantContext } from '@/shared/providers/TenantProvider';

interface CatalogMessages {
  // CatalogClient
  title:             string;
  categoriesLabel:   string;  // "categorías" / "categories"
  servicesLabel:     string;  // "servicios" / "services"
  searchPlaceholder: string;
  newCategory:       string;
  emptyTitle:        string;
  emptyDesc:         string;
  emptyButton:       string;
  noResultsDesc:     string;
  noResultsPrefix:   string;  // "Sin resultados para " — component appends the query
  clearSearch:       string;

  // CatalogIsland
  noCategory:        string;
  serviceSingular:   string;
  servicePlural:     string;
  emptyCategoryMsg:  string;
  colService:        string;
  colPrice:          string;
  colDuration:       string;
  colDeposit:        string;
  colStatus:         string;
  addService:        string;
  editCategoryTitle: string;

  // ServiceRow
  statusActive:    string;
  statusInactive:  string;
  copyLink:        string;
  copyLinkTitle:   string;
  deactivate:      string;
  activate:        string;
  editTitle:       string;
  linkCopied:      string;
  linkCopyError:   string;

  // ServiceDrawer
  editService:        string;
  newService:         string;
  catalogPrefix:      string;
  serviceNameLabel:   string;
  namePlaceholderEs:  string;
  namePlaceholderEn:  string;
  namePlaceholderPt:  string;
  descPlaceholder:    string;
  priceLabel:         string;
  durationLabel:      string;
  depositLabel:       string;
  depositFull:        string;
  depositNone:        string;
  depositPartialSuffix: string;  // e.g. "% al reservar" — component prepends "La clienta paga el N"
  bufferBeforeLabel:  string;
  bufferAfterLabel:   string;
  categoryLabel:      string;
  calendarColor:      string;
  serviceActiveLabel: string;
  serviceActiveHint:  string;
  cancel:             string;
  saveChanges:        string;
  createService:      string;

  // CategoryDrawer
  editCategory:             string;
  newCategoryTitle:         string;
  categoryNameLabel:        string;
  categoryNamePlaceholder:  string;
  categoryDescPlaceholder:  string;
  categoryActiveLabel:      string;
  categoryActiveHint:       string;
  saveCategoryChanges:      string;
  createCategory:           string;
}

const CATALOG_I18N: Record<'pt' | 'es' | 'en', CatalogMessages> = {
  pt: {
    title:             'Catálogo',
    categoriesLabel:   'categorias',
    servicesLabel:     'serviços',
    searchPlaceholder: 'Procurar serviço...',
    newCategory:       'Nova categoria',
    emptyTitle:        'O seu catálogo está vazio',
    emptyDesc:         'Crie categorias para organizar os seus serviços e configure os preços e depósitos de cada um.',
    emptyButton:       'Criar primeira categoria',
    noResultsDesc:     'Tente com outro nome de serviço.',
    noResultsPrefix:   'Sem resultados para ',
    clearSearch:       'Limpar pesquisa',

    noCategory:       'Sem categoria',
    serviceSingular:  'serviço',
    servicePlural:    'serviços',
    emptyCategoryMsg: 'Esta categoria está vazia.',
    colService:       'Serviço',
    colPrice:         'Preço',
    colDuration:      'Duração',
    colDeposit:       'Depósito',
    colStatus:        'Estado',
    addService:       'Adicionar serviço',
    editCategoryTitle:'Editar categoria',

    statusActive:   'Ativo',
    statusInactive: 'Inativo',
    copyLink:       'Copiar link',
    copyLinkTitle:  'Copiar link de reserva',
    deactivate:     'Desativar',
    activate:       'Ativar',
    editTitle:      'Editar',
    linkCopied:     'Link copiado',
    linkCopyError:  'Não foi possível copiar o link',

    editService:          'Editar Serviço',
    newService:           'Novo Serviço',
    catalogPrefix:        'Catálogo ·',
    serviceNameLabel:     'Nome do serviço',
    namePlaceholderEs:    'Nome em Español',
    namePlaceholderEn:    'Name in English',
    namePlaceholderPt:    'Nome em Português',
    descPlaceholder:      'Descrição (opcional)',
    priceLabel:           'Preço (€)',
    durationLabel:        'Duração (min)',
    depositLabel:         'Depósito ao reservar',
    depositFull:          'Pagamento completo ao reservar',
    depositNone:          'Sem depósito (pagamento na consulta)',
    depositPartialSuffix: '% ao reservar',
    bufferBeforeLabel:    'Buffer anterior (min)',
    bufferAfterLabel:     'Buffer posterior (min)',
    categoryLabel:        'Categoria',
    calendarColor:        'Cor no calendário',
    serviceActiveLabel:   'Serviço ativo',
    serviceActiveHint:    'Visível na página de reservas',
    cancel:               'Cancelar',
    saveChanges:          'Guardar alterações',
    createService:        'Criar serviço',

    editCategory:            'Editar Categoria',
    newCategoryTitle:        'Nova Categoria',
    categoryNameLabel:       'Nome da categoria',
    categoryNamePlaceholder: 'Ex: Faciais, Penteados…',
    categoryDescPlaceholder: 'Descrição breve (opcional)',
    categoryActiveLabel:     'Categoria ativa',
    categoryActiveHint:      'Aparece na página de reservas',
    saveCategoryChanges:     'Guardar',
    createCategory:          'Criar categoria',
  },

  es: {
    title:             'Catálogo',
    categoriesLabel:   'categorías',
    servicesLabel:     'servicios',
    searchPlaceholder: 'Buscar servicio...',
    newCategory:       'Nueva categoría',
    emptyTitle:        'Tu catálogo está vacío',
    emptyDesc:         'Crea categorías para organizar tus servicios y configura los precios y depósitos de cada uno.',
    emptyButton:       'Crear primera categoría',
    noResultsDesc:     'Prueba con otro nombre de servicio.',
    noResultsPrefix:   'Sin resultados para ',
    clearSearch:       'Limpiar búsqueda',

    noCategory:       'Sin categoría',
    serviceSingular:  'servicio',
    servicePlural:    'servicios',
    emptyCategoryMsg: 'Esta categoría está vacía.',
    colService:       'Servicio',
    colPrice:         'Precio',
    colDuration:      'Duración',
    colDeposit:       'Depósito',
    colStatus:        'Estado',
    addService:       'Añadir servicio',
    editCategoryTitle:'Editar categoría',

    statusActive:   'Activo',
    statusInactive: 'Inactivo',
    copyLink:       'Copiar link',
    copyLinkTitle:  'Copiar link de reserva',
    deactivate:     'Desactivar',
    activate:       'Activar',
    editTitle:      'Editar',
    linkCopied:     'Link copiado',
    linkCopyError:  'No se pudo copiar el link',

    editService:          'Editar Servicio',
    newService:           'Nuevo Servicio',
    catalogPrefix:        'Catálogo ·',
    serviceNameLabel:     'Nombre del servicio',
    namePlaceholderEs:    'Nombre en Español',
    namePlaceholderEn:    'Name in English',
    namePlaceholderPt:    'Nome em Português',
    descPlaceholder:      'Descripción (opcional)',
    priceLabel:           'Precio (€)',
    durationLabel:        'Duración (min)',
    depositLabel:         'Depósito al reservar',
    depositFull:          'Pago completo al reservar',
    depositNone:          'Sin depósito (pago en cita)',
    depositPartialSuffix: '% al reservar',
    bufferBeforeLabel:    'Buffer previo (min)',
    bufferAfterLabel:     'Buffer posterior (min)',
    categoryLabel:        'Categoría',
    calendarColor:        'Color en calendario',
    serviceActiveLabel:   'Servicio activo',
    serviceActiveHint:    'Visible en la página de reservas',
    cancel:               'Cancelar',
    saveChanges:          'Guardar cambios',
    createService:        'Crear servicio',

    editCategory:            'Editar Categoría',
    newCategoryTitle:        'Nueva Categoría',
    categoryNameLabel:       'Nombre de categoría',
    categoryNamePlaceholder: 'Ej: Faciales, Peinados…',
    categoryDescPlaceholder: 'Descripción breve (opcional)',
    categoryActiveLabel:     'Categoría activa',
    categoryActiveHint:      'Aparece en la página de reservas',
    saveCategoryChanges:     'Guardar',
    createCategory:          'Crear categoría',
  },

  en: {
    title:             'Catalog',
    categoriesLabel:   'categories',
    servicesLabel:     'services',
    searchPlaceholder: 'Search service...',
    newCategory:       'New category',
    emptyTitle:        'Your catalog is empty',
    emptyDesc:         'Create categories to organise your services and configure prices and deposits for each one.',
    emptyButton:       'Create first category',
    noResultsDesc:     'Try a different service name.',
    noResultsPrefix:   'No results for ',
    clearSearch:       'Clear search',

    noCategory:       'No category',
    serviceSingular:  'service',
    servicePlural:    'services',
    emptyCategoryMsg: 'This category is empty.',
    colService:       'Service',
    colPrice:         'Price',
    colDuration:      'Duration',
    colDeposit:       'Deposit',
    colStatus:        'Status',
    addService:       'Add service',
    editCategoryTitle:'Edit category',

    statusActive:   'Active',
    statusInactive: 'Inactive',
    copyLink:       'Copy link',
    copyLinkTitle:  'Copy booking link',
    deactivate:     'Deactivate',
    activate:       'Activate',
    editTitle:      'Edit',
    linkCopied:     'Link copied',
    linkCopyError:  'Could not copy link',

    editService:          'Edit Service',
    newService:           'New Service',
    catalogPrefix:        'Catalog ·',
    serviceNameLabel:     'Service name',
    namePlaceholderEs:    'Nombre en Español',
    namePlaceholderEn:    'Name in English',
    namePlaceholderPt:    'Nome em Português',
    descPlaceholder:      'Description (optional)',
    priceLabel:           'Price (€)',
    durationLabel:        'Duration (min)',
    depositLabel:         'Deposit on booking',
    depositFull:          'Full payment on booking',
    depositNone:          'No deposit (pay at appointment)',
    depositPartialSuffix: '% on booking',
    bufferBeforeLabel:    'Buffer before (min)',
    bufferAfterLabel:     'Buffer after (min)',
    categoryLabel:        'Category',
    calendarColor:        'Calendar colour',
    serviceActiveLabel:   'Service active',
    serviceActiveHint:    'Visible on the booking page',
    cancel:               'Cancel',
    saveChanges:          'Save changes',
    createService:        'Create service',

    editCategory:            'Edit Category',
    newCategoryTitle:        'New Category',
    categoryNameLabel:       'Category name',
    categoryNamePlaceholder: 'e.g. Facials, Hairstyles…',
    categoryDescPlaceholder: 'Brief description (optional)',
    categoryActiveLabel:     'Category active',
    categoryActiveHint:      'Appears on the booking page',
    saveCategoryChanges:     'Save',
    createCategory:          'Create category',
  },
};

function resolveLocale(locale: string): 'pt' | 'es' | 'en' {
  return (locale === 'pt' || locale === 'en') ? locale : 'es';
}

/** Pure accessor — use when locale is already available as a prop. */
export function getCatalogT(locale: string): CatalogMessages {
  return CATALOG_I18N[resolveLocale(locale)];
}

/** React hook — use in client components that don't receive locale as prop. */
export function useCatalogT(): CatalogMessages {
  const { locale } = useTenantContext();
  return getCatalogT(locale);
}
