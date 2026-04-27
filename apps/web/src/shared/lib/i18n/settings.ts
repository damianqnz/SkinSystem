export type SettingsLocale = 'es' | 'pt' | 'en';

export const settingsTranslations = {
  es: {
    page: {
      title:                    'Ajustes',
      subtitle:                 'Configuración de tu espacio en SkinSystem',
      sectionPayments:          'Pagos',
      sectionBusiness:          'Perfil del negocio',
      sectionNotifications:     'Notificaciones',
      placeholderBusiness:      'Próximamente — nombre, logo, dirección.',
      placeholderNotifications: 'Próximamente — WhatsApp, email, recordatorios.',
    },
    stripe: {
      cardTitle:    'Stripe Connect',
      cardSubtitle: 'Plataforma de pagos · Connect Standard',
      footer:       'Los pagos se transfieren directamente a tu cuenta bancaria. SkinSystem cobra una comisión de plataforma del 10%.',
      badge: {
        connected:    'Conectado',
        pending:      'Pendiente',
        disconnected: 'No conectado',
      },
      connected: {
        labelAccountId: 'ID de cuenta',
        labelType:      'Tipo',
        labelTransfers: 'Transferencias',
        labelCurrency:  'Moneda',
        valueType:      'Standard',
        valueTransfers: 'Automáticas',
        viewDashboard:  'Ver Dashboard de Stripe',
      },
      pending: {
        body:        'Tu cuenta de Stripe fue creada pero el proceso de verificación no se completó. Haz clic abajo para continuar donde lo dejaste.',
        notice:      'Completa el onboarding para activar los cobros a clientas.',
        ctaContinue: 'Continuar verificación',
      },
      disconnected: {
        body: 'Conecta tu cuenta bancaria a través de Stripe para recibir pagos de tus clientas directamente. El proceso tarda menos de 5 minutos.',
        bullets: [
          'Pagos con tarjeta, Apple Pay y Google Pay',
          'Transferencias automáticas a tu cuenta bancaria',
          'Panel de control de cobros propio',
        ],
        ctaConnect: 'Conectar con Stripe',
      },
      overlay: {
        title:    'Te estamos llevando a Stripe',
        subtitle: 'Conexión segura con la pasarela de pagos…',
      },
      toast: {
        verifying:     'Verificando con Stripe…',
        connected:     'Cuenta Stripe vinculada correctamente.',
        linkExpired:   'El enlace de onboarding expiró. Genera uno nuevo.',
        verifyTimeout: 'El estado se actualizará en breve. Refresca si no ves el cambio.',
        actionError:   'No se pudo iniciar la conexión con Stripe.',
      },
    },
  },
  pt: {
    page: {
      title:                    'Definições',
      subtitle:                 'Configuração do teu espaço no SkinSystem',
      sectionPayments:          'Pagamentos',
      sectionBusiness:          'Perfil do negócio',
      sectionNotifications:     'Notificações',
      placeholderBusiness:      'Em breve — nome, logo, morada.',
      placeholderNotifications: 'Em breve — WhatsApp, email, lembretes.',
    },
    stripe: {
      cardTitle:    'Stripe Connect',
      cardSubtitle: 'Plataforma de pagamentos · Connect Standard',
      footer:       'Os pagamentos são transferidos diretamente para a tua conta bancária. SkinSystem cobra uma comissão de plataforma de 10%.',
      badge: {
        connected:    'Ligado',
        pending:      'Pendente',
        disconnected: 'Não ligado',
      },
      connected: {
        labelAccountId: 'ID da conta',
        labelType:      'Tipo',
        labelTransfers: 'Transferências',
        labelCurrency:  'Moeda',
        valueType:      'Standard',
        valueTransfers: 'Automáticas',
        viewDashboard:  'Ver Dashboard do Stripe',
      },
      pending: {
        body:        'A tua conta Stripe foi criada mas o processo de verificação não foi concluído. Clica abaixo para continuar de onde paraste.',
        notice:      'Conclui o onboarding para ativar os pagamentos das tuas clientes.',
        ctaContinue: 'Continuar verificação',
      },
      disconnected: {
        body: 'Liga a tua conta bancária através do Stripe para receber pagamentos das tuas clientes diretamente. O processo demora menos de 5 minutos.',
        bullets: [
          'Pagamentos com cartão, Apple Pay e Google Pay',
          'Transferências automáticas para a tua conta bancária',
          'Painel de controlo de pagamentos próprio',
        ],
        ctaConnect: 'Ligar com Stripe',
      },
      overlay: {
        title:    'A levar-te para o Stripe',
        subtitle: 'Ligação segura com a plataforma de pagamentos…',
      },
      toast: {
        verifying:     'A verificar com o Stripe…',
        connected:     'Conta Stripe ligada com sucesso.',
        linkExpired:   'O link de onboarding expirou. Gera um novo.',
        verifyTimeout: 'O estado será atualizado em breve. Atualiza se não vires a mudança.',
        actionError:   'Não foi possível iniciar a ligação com o Stripe.',
      },
    },
  },
  en: {
    page: {
      title:                    'Settings',
      subtitle:                 'Configure your SkinSystem workspace',
      sectionPayments:          'Payments',
      sectionBusiness:          'Business profile',
      sectionNotifications:     'Notifications',
      placeholderBusiness:      'Coming soon — name, logo, address.',
      placeholderNotifications: 'Coming soon — WhatsApp, email, reminders.',
    },
    stripe: {
      cardTitle:    'Stripe Connect',
      cardSubtitle: 'Payments platform · Connect Standard',
      footer:       'Payments are transferred directly to your bank account. SkinSystem charges a 10% platform fee.',
      badge: {
        connected:    'Connected',
        pending:      'Pending',
        disconnected: 'Not connected',
      },
      connected: {
        labelAccountId: 'Account ID',
        labelType:      'Type',
        labelTransfers: 'Transfers',
        labelCurrency:  'Currency',
        valueType:      'Standard',
        valueTransfers: 'Automatic',
        viewDashboard:  'Open Stripe Dashboard',
      },
      pending: {
        body:        'Your Stripe account was created but verification is not complete. Click below to pick up where you left off.',
        notice:      'Finish onboarding to start accepting payments from your clients.',
        ctaContinue: 'Continue verification',
      },
      disconnected: {
        body: 'Connect your bank account through Stripe to receive payments from your clients directly. It takes less than 5 minutes.',
        bullets: [
          'Card payments, Apple Pay and Google Pay',
          'Automatic payouts to your bank account',
          'Your own payments dashboard',
        ],
        ctaConnect: 'Connect with Stripe',
      },
      overlay: {
        title:    'Taking you to Stripe',
        subtitle: 'Securely connecting to the payments platform…',
      },
      toast: {
        verifying:     'Verifying with Stripe…',
        connected:     'Stripe account connected successfully.',
        linkExpired:   'The onboarding link expired. Generate a new one.',
        verifyTimeout: 'The status will update shortly. Refresh if you don’t see the change.',
        actionError:   'Could not start the Stripe connection.',
      },
    },
  },
} as const;

export type SettingsT = (typeof settingsTranslations)[SettingsLocale];

export function pickSettingsLocale(raw: string | null | undefined): SettingsLocale {
  const v = (raw ?? '').toLowerCase();
  if (v === 'pt') return 'pt';
  if (v === 'en') return 'en';
  return 'es';
}
