'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { resolvePostAuthDestination } from '@/infrastructure/auth/resolve-post-auth-destination';

// ── Validation ────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  next:     z.string().optional(),
});

export type LoginState = { error: keyof AuthErrors } | null;
type AuthErrors = {
  invalid_credentials: string;
  no_account:          string;
  generic:             string;
};

// ── Action ────────────────────────────────────────────────────────
/**
 * Unified email/password sign-in via Supabase PKCE-ready client.
 *
 * After the credentials check, every routing decision lives in
 * `resolvePostAuthDestination` (shared with /auth/callback and /auth/confirm):
 *   1. `profiles` row in THIS tenant → staff dashboard.
 *   2. `customers` row linked to this auth user, or activated from a verified
 *      email match in THIS tenant → customer space (`/me`).
 *   3. Anything else → `no_account` (signed out; the UI directs the user to
 *      `/book` to start a first reservation).
 *
 * The action is tenant-scoped by design: a customer of Lourdes cannot use the
 * same login form on Gloria's subdomain to slip into Gloria's /me.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
    next:     formData.get('next') ?? undefined,
  });
  if (!parsed.success) return { error: 'invalid_credentials' };
  const { email, password, next } = parsed.data;

  // Tenant context (the subdomain the user is browsing)
  const tenantSlug = (await headers()).get('x-tenant-slug') ?? '';
  if (!tenantSlug) return { error: 'generic' };

  // Sign in with Supabase (sets session cookies via SSR client)
  const supabase = await createSupabaseServerClient();
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
  if (authError) return { error: 'invalid_credentials' };

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'generic' };

  const destination = await resolvePostAuthDestination({
    supabase,
    user,
    tenantSlug,
    next: { kind: 'url', url: next },
  });

  if (destination.kind === 'redirect') redirect(destination.url);
  return { error: destination.kind === 'no_account' ? 'no_account' : 'generic' };
}
