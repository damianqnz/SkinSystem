/**
 * @file middleware.ts
 * @description Standard Next.js middleware for SkinSystem.
 *
 * Responsibilities (in order):
 *   1. Refresh Supabase auth session on every request.
 *   2. Extract tenant slug from the subdomain.
 *   3. Inject `x-tenant-slug` and `x-locale` headers for Server Components.
 *   4. Guard dashboard routes — redirect to auth portal if unauthenticated.
 *
 * NOTE: No URL rewriting to [tenant]/[locale] segments.
 * Routing is handled by Next.js route groups: (public) and (dashboard).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/infrastructure/supabase/middleware-client';

// ── Configuration ─────────────────────────────────────────────

const SUPPORTED_LOCALES = ['es', 'pt', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = 'es';

/** Subdomains that are never treated as tenant slugs. */
const RESERVED_SUBDOMAINS = new Set(['www', 'auth', 'api', 'admin', 'app']);

/** Recognised base domains (includes local dev aliases). */
const BASE_DOMAINS = [
  'skinsystem.pt',
  'localhost:3000',
  'lvh.me:3000',
  'lvh.me',
];

// ── Helpers ───────────────────────────────────────────────────

/**
 * Extracts the tenant slug from the request hostname.
 * Returns null for the root domain, reserved subdomains, or unknown hosts.
 *
 * @example
 * extractTenantSlug('lourdes.skinsystem.pt') → 'lourdes'
 * extractTenantSlug('auth.skinsystem.pt')    → null
 * extractTenantSlug('skinsystem.pt')         → null
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
 * Resolves the user's preferred locale.
 * Priority: cookie → Accept-Language header → system default.
 */
function detectLocale(request: NextRequest): SupportedLocale {
  const fromCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie as SupportedLocale)) {
    return fromCookie as SupportedLocale;
  }

  const acceptLang = request.headers.get('accept-language') ?? '';
  const preferred = acceptLang.split(',')[0]?.split('-')[0] ?? '';
  return SUPPORTED_LOCALES.includes(preferred as SupportedLocale)
    ? (preferred as SupportedLocale)
    : DEFAULT_LOCALE;
}

// ── Middleware ────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

  // Mutable response — may be replaced on redirect.
  let response = NextResponse.next({ request });

  // ── 1. Session refresh (required by @supabase/ssr on every request) ──
  const supabase = createSupabaseMiddlewareClient(request, response);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ── 2. Tenant extraction ──────────────────────────────────────
  const tenantSlug = extractTenantSlug(hostname);

  // Non-tenant host (root domain or auth portal) — pass through.
  if (!tenantSlug) return response;

  // ── 3. Inject headers for Server Components ───────────────────
  const locale = detectLocale(request);

  response.headers.set('x-tenant-slug', tenantSlug);
  response.headers.set('x-locale', locale);

  // ── 4. Dashboard auth guard ───────────────────────────────────
  const isDashboardRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  if (isDashboardRoute && !user) {
    const baseDomain =
      process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt';
    const authUrl = new URL(`https://auth.${baseDomain}/login`);
    authUrl.searchParams.set(
      'next',
      `${request.nextUrl.protocol}//${hostname}${pathname}`,
    );
    return NextResponse.redirect(authUrl);
  }

  // ── 5. Persist locale cookie if not yet set ───────────────────
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
