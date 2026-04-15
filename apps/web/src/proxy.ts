/**
 * @description Proxy central de SkinSystem (reemplaza middleware en Next.js 16.2+).
 * Responsabilidades:
 *   1. Refrescar la sesión de Supabase Auth en cada request (obligatorio con @supabase/ssr).
 *   2. Extraer el slug del tenant desde el subdominio.
 *   3. Inyectar el header `x-tenant-slug` para Server Components.
 *   4. Proteger rutas de dashboard (requieren sesión activa).
 *   5. Detectar idioma y reescribir la URL al segmento [tenant]/[locale].
 *
 * @flow
 *   Request → Session refresh → Tenant extraction → Auth guard → i18n → Rewrite
 *
 * @note Next.js 16.2+: proxy.ts corre en Node.js runtime (no Edge).
 *       No usar `export const runtime` — no está soportado aquí.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/infrastructure/supabase/middleware-client';

// ── Configuración ─────────────────────────────────────────────
const SUPPORTED_LOCALES = ['es', 'pt', 'en'] as const;
const DEFAULT_LOCALE = 'es';

/**
 * Subdominios reservados que nunca son tenants.
 * 'auth' → portal de login compartido (auth.skinsystem.pt)
 */
const RESERVED_SUBDOMAINS = new Set(['www', 'auth', 'api', 'admin', 'app']);

/**
 * Dominios base del sistema.
 * En local se puede usar lvh.me para simular subdominios sin configurar /etc/hosts.
 */
const BASE_DOMAINS = [
  'skinsystem.pt',
  'localhost:3000',
  'lvh.me:3000',
  'lvh.me',
];

/**
 * Extrae el slug del tenant desde el hostname.
 * Retorna null si es el dominio principal, reservado o no reconocido.
 *
 * @example
 * extractTenantSlug('lourdes.skinsystem.pt')  → 'lourdes'
 * extractTenantSlug('auth.skinsystem.pt')     → null
 * extractTenantSlug('skinsystem.pt')          → null
 * extractTenantSlug('lourdes.lvh.me:3000')    → 'lourdes'
 */
function extractTenantSlug(hostname: string): string | null {
  for (const base of BASE_DOMAINS) {
    if (hostname === base) return null;

    if (hostname.endsWith(`.${base}`)) {
      const sub = hostname.slice(0, hostname.length - base.length - 1);
      if (!sub || RESERVED_SUBDOMAINS.has(sub)) return null;
      return sub;
    }
  }
  return null;
}

/**
 * Detecta el locale preferido del usuario.
 * Prioridad: cookie → Accept-Language → default.
 */
function detectLocale(request: NextRequest): string {
  const fromCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie as never)) {
    return fromCookie;
  }

  const acceptLang = request.headers.get('accept-language') ?? '';
  const preferred = acceptLang.split(',')[0]?.split('-')[0] ?? '';
  return SUPPORTED_LOCALES.includes(preferred as never)
    ? preferred
    : DEFAULT_LOCALE;
}

// ── Proxy principal ───────────────────────────────────────────
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

  let response = NextResponse.next({ request });

  // ── 1. Session refresh (SIEMPRE, en cada request) ────────────
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. Extracción del tenant ──────────────────────────────────
  const tenantSlug = extractTenantSlug(hostname);

  if (!tenantSlug) {
    return response;
  }

  // ── 3. Inyectar header para Server Components ────────────────
  response.headers.set('x-tenant-slug', tenantSlug);

  // ── 4. Protección de rutas del dashboard ─────────────────────
  const isDashboardRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  if (isDashboardRoute && !user) {
    const authUrl = new URL(
      `https://auth.${process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt'}/login`,
    );
    authUrl.searchParams.set(
      'next',
      `${request.nextUrl.protocol}//${hostname}${pathname}`,
    );
    return NextResponse.redirect(authUrl);
  }

  // ── 5. Detección de idioma ────────────────────────────────────
  const locale = detectLocale(request);

  // ── 6. Rewrite de URL ─────────────────────────────────────────
  const url = request.nextUrl.clone();

  if (url.pathname.startsWith(`/${tenantSlug}/`)) {
    return response;
  }

  url.pathname = `/${tenantSlug}/${locale}${pathname}`;
  response = NextResponse.rewrite(url, { request });

  response.headers.set('x-tenant-slug', tenantSlug);

  if (!request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

// ── Matcher ───────────────────────────────────────────────────
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|icons|images|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif)$).*)',
  ],
};
