// ── Type ──────────────────────────────────────────────────────

export interface BillingMessages {
  // Filters
  dateFromLabel:  string;
  dateToLabel:    string;
  // Buttons
  generateBtn:    string;
  exportCsvBtn:   string;
  prevBtn:        string;
  nextBtn:        string;
  // Placeholder
  searchPlaceholder: string;
  // Table headers
  colDate:          string;
  colClient:        string;
  colStaff:         string;
  colService:       string;
  colServiceDate:   string;
  colAmount:        string;
  colMethod:        string;
  colStatus:        string;
  colAppointmentId: string;
  // Status chips
  statusSucceeded: string;
  statusPending:   string;
  statusFailed:    string;
  statusRefunded:  string;
  // Empty states  ({generateBtn} placeholder interpolated at render time)
  emptyNoData:  string;
  emptySearch:  string;
  emptyInitial: string;
  // Pagination ({from} {to} {total} {page} {totalPages} interpolated at render time)
  pageIndicator: string;
  // CSV column headers
  csvColDate:          string;
  csvColClient:        string;
  csvColStaff:         string;
  csvColService:       string;
  csvColServiceDate:   string;
  csvColAmount:        string;
  csvColMethod:        string;
  csvColStripeId:      string;
  csvColStatus:        string;
  csvColAppointmentId: string;
  // Tooltip
  viewInStripe: string;
}

// ── Translations ──────────────────────────────────────────────

const BILLING_I18N: Record<'pt' | 'es' | 'en', BillingMessages> = {
  pt: {
    dateFromLabel:     'De',
    dateToLabel:       'Até',
    generateBtn:       'Gerar',
    exportCsvBtn:      'Exportar CSV',
    prevBtn:           '← Anterior',
    nextBtn:           'Seguinte →',
    searchPlaceholder: 'Pesquisar cliente, serviço, data...',

    colDate:          'Data pagamento',
    colClient:        'Cliente',
    colStaff:         'Profissional',
    colService:       'Serviço',
    colServiceDate:   'Data serviço',
    colAmount:        'Valor',
    colMethod:        'Método',
    colStatus:        'Estado',
    colAppointmentId: 'ID Agend.',

    statusSucceeded: 'Pago',
    statusPending:   'Pendente',
    statusFailed:    'Falhou',
    statusRefunded:  'Reembolso',

    emptyNoData:  'Sem pagamentos no período selecionado.',
    emptySearch:  'Sem resultados para a pesquisa.',
    emptyInitial: 'Seleciona o período e clica em {generateBtn} para carregar os pagamentos.',

    pageIndicator: '{from}–{to} de {total} · Página {page} de {totalPages}',

    csvColDate:          'Data Pagamento',
    csvColClient:        'Cliente',
    csvColStaff:         'Profissional',
    csvColService:       'Serviço',
    csvColServiceDate:   'Data Serviço',
    csvColAmount:        'Valor',
    csvColMethod:        'Método',
    csvColStripeId:      'ID Stripe',
    csvColStatus:        'Estado',
    csvColAppointmentId: 'ID Agendamento',

    viewInStripe: 'Ver no Stripe',
  },

  es: {
    dateFromLabel:     'Desde',
    dateToLabel:       'Hasta',
    generateBtn:       'Generar',
    exportCsvBtn:      'Exportar CSV',
    prevBtn:           '← Anterior',
    nextBtn:           'Siguiente →',
    searchPlaceholder: 'Buscar cliente, servicio, fecha...',

    colDate:          'Fecha pago',
    colClient:        'Cliente',
    colStaff:         'Profesional',
    colService:       'Servicio',
    colServiceDate:   'Fecha servicio',
    colAmount:        'Valor',
    colMethod:        'Método',
    colStatus:        'Estado',
    colAppointmentId: 'ID Agend.',

    statusSucceeded: 'Pago',
    statusPending:   'Pendiente',
    statusFailed:    'Fallido',
    statusRefunded:  'Reembolso',

    emptyNoData:  'Sin pagos en el período seleccionado.',
    emptySearch:  'Sin resultados para la búsqueda.',
    emptyInitial: 'Selecciona el período y haz clic en {generateBtn} para cargar los pagos.',

    pageIndicator: '{from}–{to} de {total} · Página {page} de {totalPages}',

    csvColDate:          'Fecha Pago',
    csvColClient:        'Cliente',
    csvColStaff:         'Profesional',
    csvColService:       'Servicio',
    csvColServiceDate:   'Fecha Servicio',
    csvColAmount:        'Valor',
    csvColMethod:        'Método',
    csvColStripeId:      'ID Stripe',
    csvColStatus:        'Estado',
    csvColAppointmentId: 'ID Agendamiento',

    viewInStripe: 'Ver en Stripe',
  },

  en: {
    dateFromLabel:     'From',
    dateToLabel:       'To',
    generateBtn:       'Generate',
    exportCsvBtn:      'Export CSV',
    prevBtn:           '← Previous',
    nextBtn:           'Next →',
    searchPlaceholder: 'Search client, service, date...',

    colDate:          'Payment date',
    colClient:        'Client',
    colStaff:         'Staff',
    colService:       'Service',
    colServiceDate:   'Service date',
    colAmount:        'Amount',
    colMethod:        'Method',
    colStatus:        'Status',
    colAppointmentId: 'Appt. ID',

    statusSucceeded: 'Paid',
    statusPending:   'Pending',
    statusFailed:    'Failed',
    statusRefunded:  'Refunded',

    emptyNoData:  'No payments in the selected period.',
    emptySearch:  'No results for the search.',
    emptyInitial: 'Select the period and click {generateBtn} to load payments.',

    pageIndicator: '{from}–{to} of {total} · Page {page} of {totalPages}',

    csvColDate:          'Payment Date',
    csvColClient:        'Client',
    csvColStaff:         'Staff',
    csvColService:       'Service',
    csvColServiceDate:   'Service Date',
    csvColAmount:        'Amount',
    csvColMethod:        'Method',
    csvColStripeId:      'Stripe ID',
    csvColStatus:        'Status',
    csvColAppointmentId: 'Appointment ID',

    viewInStripe: 'View in Stripe',
  },
};

// ── Accessor ──────────────────────────────────────────────────

export function getTranslations(locale: string): BillingMessages {
  const key = (locale === 'es' || locale === 'en') ? locale : 'pt';
  return BILLING_I18N[key];
}
