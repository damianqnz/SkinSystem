export type AuthLocale = 'es' | 'pt' | 'en';

export const authTranslations = {
  es: {
    brand:    'SkinSystem',
    tagline:  'Tu espacio de belleza personal.',
    heading:  'Bienvenida\nde vuelta.',
    subtitle: 'Accede a tu espacio personal.',
    email:    'Correo electrónico',
    password: 'Contraseña',
    submit:   'Entrar',
    loading:  'Iniciando sesión…',
    forgot:   '¿Olvidaste tu contraseña?',
    noAccountCtaLead:   '¿Primera vez por aquí?',
    noAccountCtaAction: 'Reserva tu primera cita',
    errors: {
      invalid_credentials: 'Email o contraseña incorrectos.',
      no_account:          'No encontramos una cuenta asociada a este espacio.',
      generic:             'Algo fue mal. Inténtalo de nuevo.',
    },
  },
  pt: {
    brand:    'SkinSystem',
    tagline:  'O teu espaço de beleza pessoal.',
    heading:  'Bem-vinda\nde volta.',
    subtitle: 'Acede ao teu espaço pessoal.',
    email:    'Email',
    password: 'Palavra-passe',
    submit:   'Entrar',
    loading:  'A iniciar sessão…',
    forgot:   'Esqueceste a palavra-passe?',
    noAccountCtaLead:   'Primeira vez por aqui?',
    noAccountCtaAction: 'Reserva a tua primeira consulta',
    errors: {
      invalid_credentials: 'Email ou palavra-passe incorretos.',
      no_account:          'Não encontrámos nenhuma conta associada a este espaço.',
      generic:             'Algo correu mal. Tenta novamente.',
    },
  },
  en: {
    brand:    'SkinSystem',
    tagline:  'Your personal beauty space.',
    heading:  'Welcome\nback.',
    subtitle: 'Access your personal space.',
    email:    'Email',
    password: 'Password',
    submit:   'Sign in',
    loading:  'Signing in…',
    forgot:   'Forgot your password?',
    noAccountCtaLead:   'First time here?',
    noAccountCtaAction: 'Book your first appointment',
    errors: {
      invalid_credentials: 'Invalid email or password.',
      no_account:          'We couldn\u2019t find an account for this space.',
      generic:             'Something went wrong. Please try again.',
    },
  },
} as const;

export type AuthT = (typeof authTranslations)[AuthLocale];

/** Detecta el locale a partir del header Accept-Language. */
export function detectAuthLocale(acceptLanguage: string): AuthLocale {
  const preferred = acceptLanguage.split(',')[0]?.split('-')[0]?.toLowerCase();
  if (preferred === 'pt') return 'pt';
  if (preferred === 'en') return 'en';
  return 'es';
}
