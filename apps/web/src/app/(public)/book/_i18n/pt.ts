/**
 * @file _i18n/pt.ts
 * @description Portuguese (PT) labels for the consumer booking funnel.
 *              Default locale of SkinSystem tenants on .pt domains.
 */

import type { BookingLabels } from './types';

export const pt: BookingLabels = {
  header: {
    title: 'Reserva Online',
    back:  'Voltar ao início',
  },
  steps: {
    service:  'Serviço',
    calendar: 'Horário',
    auth:     'Acesso',
    confirm:  'Confirmar',
  },
  common: {
    back:    'Voltar',
    minutes: 'min',
  },
  service: {
    heading:      'Que tratamento deseja?',
    empty:        'Não há serviços disponíveis neste momento',
    select:       'Selecionar →',
    fallbackName: 'Tratamento',
    deposit:      'Depósito {percent}% · {amount} agora',
  },
  calendar: {
    heading: 'Escolha a data e hora',
    empty:   'Não há horários disponíveis',
    monthNames: [
      'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
      'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
    ],
    dayHeaders: ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'],
  },
  auth: {
    headingOptions:         'Entre para reservar',
    subtitleOptions:        'Aceda ou crie uma conta para continuar',
    google:                 'Continuar com Google',
    email:                  'Continuar com Email',
    createProfile:          'Criar perfil',
    continueGuest:          'Continuar como convidado',
    or:                     'ou',
    headingLogin:           'Iniciar sessão',
    subtitleLogin:          'Aceda à sua conta para reservar',
    headingRegister:        'Criar perfil',
    subtitleRegister:       'Crie a sua conta para gerir as suas marcações',
    back:                   '← Voltar',
    emailLabel:             'Email',
    passwordLabel:          'Palavra-passe',
    fullNameLabel:          'Nome completo',
    emailPlaceholder:       'ana@email.com',
    passwordPlaceholder:    '••••••••',
    passwordMinPlaceholder: 'Mín. 6 caracteres',
    fullNamePlaceholder:    'Ana Silva',
    enter:                  'Entrar',
    createAccount:          'Criar conta',
    noAccount:              'Não tem conta?',
    createNow:              'Criar perfil',
    errorCredentials:       'Email ou palavra-passe incorretos',
  },
  confirm: {
    heading:            'Confirme a sua reserva',
    dateTime:           'Data e hora',
    reservedAs:         'Reservado como',
    policyFallback:     'Ao reservar aceita a política de cancelamento.',
    stripeSecure:       'Pagamento seguro com Stripe',
    payButton:          'Pagar {amount}',
    bookButton:         'Confirmar reserva',
    payButtonGuest:     'Pagar {amount} →',
    bookButtonGuest:    'Confirmar reserva →',
    redirecting:        'A redirecionar para o pagamento…',
    nameLabel:          'Nome completo',
    phoneLabel:         'Telefone',
    emailLabel:         'Email',
    addressLabel:       'Morada',
    noteLabel:          'Nota (opcional)',
    namePlaceholder:    'Ana Silva',
    phonePlaceholder:   '+351 900 000 000',
    emailPlaceholder:   'ana@email.com',
    addressPlaceholder: 'Rua, número, cidade',
    notePlaceholder:    'Alergias, preferências, informação relevante...',
    emailHelp:          'Irá receber a confirmação neste email.',
    acceptTerms:        'Aceito os termos e condições',
    viewPolicy:         'Ver política',
    termsRequiredError: 'Tem de aceitar os termos para continuar.',
    conflictError:      'Este horário acabou de ser reservado. Escolha outro.',
  },
  summary: {
    heading:           'Resumo',
    subtotalOnline:    'Subtotal online',
    couponPlaceholder: 'Código de desconto',
    couponApply:       'Aplicar',
    totalNow:          'Total agora',
    localBalance:      'Saldo a pagar no local',
  },
  notices: {
    cancelledPayment: 'O seu pagamento foi cancelado. Pode escolher outro horário ou tentar novamente.',
    oauthError:       'Erro ao autenticar com Google. Tente novamente ou continue como convidado.',
  },
  metadata: {
    title: 'Reservar marcação — {name}',
  },
};
