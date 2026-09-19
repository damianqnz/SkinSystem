import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';
import { parseRelativeNext }           from '@/infrastructure/auth/resolve-redirect-url';
import { resolvePostAuthDestination }  from '@/infrastructure/auth/resolve-post-auth-destination';
import { postAuthResponse }            from '@/infrastructure/auth/post-auth-response';

/** Where a session lands when `next` is absent or not a safe relative path. */
const DEFAULT_NEXT = '/book';

/**
 * OAuth callback handler for Supabase Auth providers (Google, Apple).
 *
 * Flow:
 *   1. Provider redirects here with ?code=<pkce_code>&next=<return_path>
 *   2. We exchange the code for a session (sets auth cookies).
 *   3. The session goes through `resolvePostAuthDestination`, the same funnel as
 *      /login and /auth/confirm, so a Google-authenticated user activates their
 *      customer row here too, then is redirected to `next` (default "/book").
 *
 * `next` must be a relative same-origin path (single leading slash); anything
 * else falls back to the default. For a booking-funnel `next` (/book…) a user
 * with no customer row yet is NOT signed out: the row is created later by the
 * booking upsert and activation is retried at the next sign-in.
 *
 * The tenant comes from `x-tenant-slug` (set by the proxy), never the query.
 * The `redirectTo` passed to signInWithOAuth must point to this route on the
 * tenant's own subdomain, e.g. https://lourdes.skinsystem.app/auth/callback?next=/book
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code       = searchParams.get('code');
  const tenantSlug = request.headers.get('x-tenant-slug');
  const nextPath   = parseRelativeNext(searchParams.get('next')) ?? DEFAULT_NEXT;

  if (code && tenantSlug) {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      const destination = await resolvePostAuthDestination({
        supabase,
        user: data.user,
        tenantSlug,
        next: { kind: 'path', path: nextPath },
      });
      return postAuthResponse(destination, origin);
    }
  }

  // If something went wrong, send back to booking with an error flag
  return NextResponse.redirect(`${origin}/book?auth_error=1`);
}
