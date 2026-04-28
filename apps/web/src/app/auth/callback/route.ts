import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient }  from '@/infrastructure/supabase/server';

/**
 * OAuth callback handler for Supabase Auth providers (Google, Apple).
 *
 * Flow:
 *   1. Provider redirects here with ?code=<pkce_code>&next=<return_path>
 *   2. We exchange the code for a session (sets auth cookies).
 *   3. Redirect the user to `next` (defaults to "/book").
 *
 * The `redirectTo` passed to signInWithOAuth must point to this route,
 * including the current subdomain so tenant isolation is preserved.
 * Example: https://lourdes.skinsystem.app/auth/callback?next=/book
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/book';

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, send back to booking with an error flag
  return NextResponse.redirect(`${origin}/book?auth_error=1`);
}
