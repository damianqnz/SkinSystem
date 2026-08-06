/**
 * @file proxy.ts
 * @description Next.js 16.2+ Node.js request proxy for SkinSystem.
 *              Runs in Node.js runtime (not Edge) — do NOT add `export const runtime`.
 *
 * Thin orchestrator. Host/tenant resolution lives in `infrastructure/tenant/host`,
 * locale resolution in `i18n/detect-locale`, login URLs in `infrastructure/auth`.
 *
 * NOTE: this proxy does NOT rewrite into a `[tenant]` segment. Tenant context
 * travels via `x-tenant-slug`. Introducing the rewrite requires the
 * `(tenant)/[tenant]` route group to exist first.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/infrastructure/supabase/middleware-client';
import { extractTenantSlug, normalizeHost } from '@/infrastructure/tenant/host';
import { buildLoginUrl } from '@/infrastructure/auth/build-login-url';
import { detectLocale, detectDashboardLocale } from '@/i18n/detect-locale';

/**
 * Headers this proxy owns. Any inbound copy is attacker-controlled and is
 * deleted before the request reaches a Server Component — without this, a
 * client could send `x-tenant-slug: <victim>` to the apex domain and have it
 * flow straight into `headers()`, because the apex never assigns it.
 */
const CONTROLLED_HEADERS = ['x-tenant-slug', 'x-locale'] as const;

/** Prefixes that always require an authenticated session. */
const PRIVATE_PREFIXES = ['/dashboard', '/admin'] as const;

/** Exact segment match — `/administration` must not match the `/admin` prefix. */
function isPrivatePath(pathname: string): boolean {
  return PRIVATE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Carries Supabase's refreshed auth cookies onto a different response. */
function redirectWithSession(from: NextResponse, to: URL): NextResponse {
  const redirect = NextResponse.redirect(to);
  for (const cookie of from.cookies.getAll()) redirect.cookies.set(cookie);
  return redirect;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tenantSlug = extractTenantSlug(normalizeHost(request.headers.get('host')));
  const isPrivate = isPrivatePath(pathname);
  const locale = isPrivate ? detectDashboardLocale(request) : detectLocale(request);

  // Rebuild request headers — deleting before setting is what closes the bypass.
  // Forwarded as REQUEST headers so they reach `headers()` without being echoed
  // back to the browser.
  const requestHeaders = new Headers(request.headers);
  for (const header of CONTROLLED_HEADERS) requestHeaders.delete(header);
  requestHeaders.set('x-locale', locale);
  if (tenantSlug) requestHeaders.set('x-tenant-slug', tenantSlug);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Session refresh — required by @supabase/ssr on every request.
  const supabase = createSupabaseMiddlewareClient(request, response);
  const { data: { user } } = await supabase.auth.getUser();

  // Auth guard — runs on EVERY host, apex included. Answers with a real 307
  // instead of streaming a 200 that redirects from inside the layout.
  if (isPrivate && !user) {
    return redirectWithSession(response, buildLoginUrl(request, pathname));
  }
  if (isPrivate && !tenantSlug) {
    return redirectWithSession(response, new URL('/', request.url));
  }

  // Seed the public locale cookie once. Public segment only, so the staff-scoped
  // dashboard preference never contaminates the consumer-facing locale.
  if (!isPrivate && !request.cookies.get('NEXT_LOCALE')) {
    response.cookies.set('NEXT_LOCALE', locale, {
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
    });
  }

  return response;
}

// Excludes /api, every Next.js internal, and all static assets.
export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|_next/data|favicon.ico|fonts/|icons/|images/|robots.txt|sitemap.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|css|js|map|woff|woff2|ttf)$).*)',
  ],
};
