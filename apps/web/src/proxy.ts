/**
 * @file proxy.ts
 * @description Next.js 16.2+ Node.js request proxy for SkinSystem.
 *              Runs in Node.js runtime (not Edge) — do NOT add `export const runtime`.
 *
 * Responsibilities (in order):
 *   1. Refresh Supabase auth session on every request.
 *   2. Extract tenant slug from the subdomain.
 *   3. Inject `x-tenant-slug` and `x-locale` headers for Server Components.
 *   4. Guard dashboard routes — redirect to auth portal if unauthenticated.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/infrastructure/supabase/middleware-client';

// ── Configuration ─────────────────────────────────────────────

const SUPPORTED_LOCALES = ['es', 'pt', 'en'] as const;
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];
const DEFAULT_LOCALE: SupportedLocale = 'pt';

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
 * Maps a raw browser language tag to one of the supported locales.
 *
 * Rules:
 *  - Any Spanish variant (`es`, `es-AR`, `es-MX`, …) → `'es'`
 *  - Any Portuguese variant (`pt`, `pt-BR`, `pt-PT`, …) → `'pt'`
 *  - Anything else (English, French, German, …) → `'en'`
 *  - Empty/invalid input → `null` (caller decides the fallback)
 */
function mapBrowserLangToLocale(raw: string): SupportedLocale | null {
  const tag = raw.trim().toLowerCase();
  if (!tag) return null;
  const primary = tag.split('-')[0];
  if (primary === 'es') return 'es';
  if (primary === 'pt') return 'pt';
  return 'en';
}

/**
 * Resolves the user's preferred locale for the public segment.
 * Priority: cookie (manual choice) → Accept-Language header → default (`pt`).
 *
 * Only the exact values `'es' | 'pt' | 'en'` are persisted in the cookie,
 * since that value comes from our own Server Action (Zod-validated).
 */
function detectLocale(request: NextRequest): SupportedLocale {
  // 1. Respect the user's manual selection (persisted via Server Action).
  const fromCookie = request.cookies.get('NEXT_LOCALE')?.value;
  if (fromCookie && SUPPORTED_LOCALES.includes(fromCookie as SupportedLocale)) {
    return fromCookie as SupportedLocale;
  }

  // 2. Fall back to the browser's first Accept-Language entry.
  const acceptLang = request.headers.get('accept-language') ?? '';
  const firstTag = acceptLang.split(',')[0] ?? '';
  const mapped = mapBrowserLangToLocale(firstTag);
  if (mapped) return mapped;

  // 3. No signal → default locale (pt).
  return DEFAULT_LOCALE;
}

/**
 * Resolves the locale for the dashboard segment.
 * Priority: DASHBOARD_LOCALE cookie (per-staff mirror) → NEXT_LOCALE cookie
 * (last manual public choice on this browser) → Accept-Language → default.
 *
 * The DASHBOARD_LOCALE cookie is written by the login action (from
 * `profiles.locale`) and by `setDashboardLocaleAction`. It is intentionally
 * separate from `NEXT_LOCALE` so two staff sharing a browser do NOT inherit
 * each other's preference, and the public site language stays untouched.
 */
function detectDashboardLocale(request: NextRequest): SupportedLocale {
  const dashboardCookie = request.cookies.get('DASHBOARD_LOCALE')?.value;
  if (dashboardCookie && SUPPORTED_LOCALES.includes(dashboardCookie as SupportedLocale)) {
    return dashboardCookie as SupportedLocale;
  }
  return detectLocale(request);
}

// ── Proxy ─────────────────────────────────────────────────────

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = request.headers.get('host') ?? '';

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
  const isDashboardRoute =
    pathname.startsWith('/dashboard') || pathname.startsWith('/admin');

  const locale = isDashboardRoute
    ? detectDashboardLocale(request)
    : detectLocale(request);

  response.headers.set('x-tenant-slug', tenantSlug);
  response.headers.set('x-locale', locale);

  // ── 4. Dashboard auth guard ───────────────────────────────────

  if (isDashboardRoute && !user) {
    const isLocal = hostname.includes('lvh.me') || hostname.includes('localhost');

    let loginUrl: URL;
    if (isLocal) {
      // Dev: serve /login on the SAME tenant domain — no cross-subdomain cookie issues
      loginUrl = new URL(`http://${hostname}/login`);
      loginUrl.searchParams.set('next', `http://${hostname}${pathname}`);
    } else {
      // Production: centralised auth portal on its own subdomain
      const base = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt';
      loginUrl = new URL(`https://auth.${base}/login`);
      loginUrl.searchParams.set('next', `https://${hostname}${pathname}`);
    }

    return NextResponse.redirect(loginUrl);
  }

  // ── 5. Persist locale cookie if not yet set ───────────────────
  // Only seed NEXT_LOCALE from public-segment requests so the dashboard's
  // staff-scoped preference never contaminates the consumer-facing locale.
  if (!isDashboardRoute && !request.cookies.get('NEXT_LOCALE')) {
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
