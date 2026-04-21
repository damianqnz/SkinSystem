// ── Static integration registry ───────────────────────────────
// All integrations shown in the /dashboard/integrations page.
// "connected" state is resolved at runtime from the DB; this
// file only holds the static copy + metadata.

export type IntegrationId =
  | 'facebook'
  | 'instagram'
  | 'google-analytics'
  | 'google-tag-manager'
  | 'stripe'
  | 'google-maps';

export type IntegrationCategory = 'social' | 'analytics' | 'payment' | 'location';

export interface Integration {
  id:           IntegrationId;
  name:         string;
  tagline:      string;           // short description shown on card
  category:     IntegrationCategory;
  about:        string[];         // bullet points for "Sobre" tab
  instructions: string[];         // numbered steps for "Instruções" tab
  docsUrl?:     string;           // external docs link
  comingSoon?:  boolean;          // disables the connect flow
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  social:    'Redes Sociais',
  analytics: 'Análise e Marketing',
  payment:   'Pagamentos',
  location:  'Localização',
};

export const INTEGRATIONS: Integration[] = [
  // ── Redes Sociais ───────────────────────────────────────────
  {
    id:       'facebook',
    name:     'Facebook Reservas',
    tagline:  'Permite que visitantes da tua página do Facebook reservem diretamente.',
    category: 'social',
    about: [
      'Adiciona um botão "Reservar" diretamente na tua página do Facebook.',
      'Os clientes podem ver os teus serviços e disponibilidade sem sair do Facebook.',
      'Cada reserva sincroniza automaticamente com o teu calendário.',
    ],
    instructions: [
      'Clica em "Conectar" e inicia sessão com a tua conta do Facebook.',
      'Seleciona a página do Facebook do teu negócio.',
      'Autoriza o SkinSystem a adicionar o botão de reserva.',
      'O botão "Reservar" ficará visível na tua página em minutos.',
    ],
    docsUrl:   'https://www.facebook.com/business',
    comingSoon: true,
  },
  {
    id:       'instagram',
    name:     'Instagram Reservas',
    tagline:  'Aceita reservas diretamente pelo perfil do Instagram.',
    category: 'social',
    about: [
      'Adiciona o botão de reserva ao teu perfil do Instagram.',
      'Os clientes reservam sem sair da app — menos fricção, mais conversão.',
      'Compatível com contas de negócio e criador.',
    ],
    instructions: [
      'Clica em "Conectar" e liga a tua conta de negócio do Instagram.',
      'Confirma as permissões de acesso solicitadas.',
      'O botão "Reservar" ficará visível no teu perfil em breve.',
    ],
    docsUrl:    'https://business.instagram.com',
    comingSoon: true,
  },

  // ── Análise e Marketing ─────────────────────────────────────
  {
    id:       'google-analytics',
    name:     'Google Analytics',
    tagline:  'Acompanha visitas, conversões e comportamento na tua página de reservas.',
    category: 'analytics',
    about: [
      'Monitoriza quantos clientes visitam a tua página de reservas.',
      'Vê quais os serviços mais visualizados e onde ocorrem as desistências.',
      'Cria objetivos de conversão para cada reserva concluída.',
    ],
    instructions: [
      'Entra em analytics.google.com e cria uma propriedade GA4 para o teu site.',
      'Copia o teu ID de Medição (formato G-XXXXXXXXXX).',
      'Cola o ID no campo abaixo e guarda.',
      'Aguarda 24–48 horas para os dados começarem a aparecer.',
    ],
    docsUrl:    'https://analytics.google.com',
    comingSoon: true,
  },
  {
    id:       'google-tag-manager',
    name:     'Google Tag Manager',
    tagline:  'Adiciona e gere scripts de marketing sem tocar no código.',
    category: 'analytics',
    about: [
      'Gere todos os teus scripts de rastreio (pixels, analytics, chat) num único lugar.',
      'Sem necessidade de editar código — ativa e desativa tags com um clique.',
      'Compatible com o Facebook Pixel, Google Ads, Hotjar e mais.',
    ],
    instructions: [
      'Cria um contentor em tagmanager.google.com.',
      'Copia o teu ID de contentor (formato GTM-XXXXXXX).',
      'Cola o ID no campo abaixo e guarda — o snippet é injetado automaticamente.',
    ],
    docsUrl:    'https://tagmanager.google.com',
    comingSoon: true,
  },

  // ── Pagamentos ──────────────────────────────────────────────
  {
    id:       'stripe',
    name:     'Stripe',
    tagline:  'Recebe pagamentos online e pessoalmente com toda a segurança.',
    category: 'payment',
    about: [
      'Aceita cartão, Apple Pay, Google Pay e transferência bancária.',
      'Os pagamentos são transferidos diretamente para a tua conta bancária.',
      'Painel de controlo de cobros com relatórios detalhados.',
      'SkinSystem cobra uma comissão de plataforma de 10%.',
    ],
    instructions: [
      'Clica em "Conectar" para iniciar o processo de verificação Stripe.',
      'Preenche os dados da tua empresa e conta bancária (< 5 minutos).',
      'Após aprovação, os pagamentos ficam ativos automaticamente.',
      'Podes gerir tudo em dashboard.stripe.com.',
    ],
    docsUrl:    'https://stripe.com',
    comingSoon: false,
  },

  // ── Localização ─────────────────────────────────────────────
  {
    id:       'google-maps',
    name:     'Google Maps',
    tagline:  'Mostra a localização do teu espaço na página de reservas.',
    category: 'location',
    about: [
      'Exibe um mapa interativo com a localização do teu estúdio na página pública.',
      'Os clientes podem calcular rotas diretamente a partir da tua página.',
      'Aumenta a confiança e reduz "onde fica?" nas mensagens.',
    ],
    instructions: [
      'Obtém uma chave de API em console.cloud.google.com (Maps JavaScript API).',
      'Cola a chave no campo abaixo.',
      'O mapa ficará visível na tua página de reservas de imediato.',
    ],
    docsUrl:    'https://maps.google.com',
    comingSoon: true,
  },
];

export const INTEGRATIONS_BY_CATEGORY = (
  Object.keys(CATEGORY_LABELS) as IntegrationCategory[]
).reduce<Record<IntegrationCategory, Integration[]>>(
  (acc, cat) => {
    acc[cat] = INTEGRATIONS.filter((i) => i.category === cat);
    return acc;
  },
  {} as Record<IntegrationCategory, Integration[]>
);
