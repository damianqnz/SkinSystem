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
    errors: {
      invalid_credentials: 'Email o contraseña incorrectos.',
      no_profile:          'Tu cuenta no tiene una organización asignada.',
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
    errors: {
      invalid_credentials: 'Email ou palavra-passe incorretos.',
      no_profile:          'A tua conta não tem uma organização atribuída.',
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
    errors: {
      invalid_credentials: 'Invalid email or password.',
      no_profile:          'Your account has no organisation assigned.',
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
