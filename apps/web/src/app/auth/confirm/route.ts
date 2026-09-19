import { NextRequest } from 'next/server';
import { z }           from 'zod';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { parseRelativeNext }          from '@/infrastructure/auth/resolve-redirect-url';
import { resolvePostAuthDestination } from '@/infrastructure/auth/resolve-post-auth-destination';
import { loginErrorRedirect, postAuthResponse } from '@/infrastructure/auth/post-auth-response';

/**
 * Email-OTP / magic-link landing. Links arrive as `?token_hash=…&type=…&next=…`
 * and are consumed with `verifyOtp` (the PKCE `?code=` shape is /auth/callback).
 *
 * `type` is an explicit allow-list. `signup` is required: the live Step2Auth
 * `signUp()` confirmation shares the "Confirm signup" template. `recovery`,
 * `invite` and `email_change` are deliberately absent.
 *
 * `next` is a relative same-origin path only; anything else is ignored and the
 * resolver applies its default. The tenant comes from `x-tenant-slug`: the proxy
 * sets it on every request, /auth/* included (`UNREWRITTEN_PREFIXES` only skips
 * the tenant rewrite, not the header), and never from the query string.
 */
const confirmParamsSchema = z.object({
  token_hash: z.string().min(1),
  type:       z.enum(['email', 'magiclink', 'signup']),
});

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  // Checked BEFORE verifyOtp: a single-use token must not be burned on a host
  // that cannot route the user afterwards.
  const tenantSlug = request.headers.get('x-tenant-slug');
  const params = confirmParamsSchema.safeParse({
    token_hash: searchParams.get('token_hash'),
    type:       searchParams.get('type'),
  });
  if (!tenantSlug || !params.success) return loginErrorRedirect(origin, 'link_invalid');

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.verifyOtp(params.data);
  if (error || !data.user) return loginErrorRedirect(origin, 'link_invalid');

  const destination = await resolvePostAuthDestination({
    supabase,
    user: data.user,
    tenantSlug,
    next: { kind: 'path', path: parseRelativeNext(searchParams.get('next')) },
  });
  return postAuthResponse(destination, origin);
}
