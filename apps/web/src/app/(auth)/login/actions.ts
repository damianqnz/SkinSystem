'use server';

import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { resolvePostAuthDestination } from '@/infrastructure/auth/resolve-post-auth-destination';
import { buildTenantOrigin } from '@/infrastructure/auth/resolve-redirect-url';

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

// ── OTP (passwordless magic-link) ─────────────────────────────────
const otpSchema = z.string().email();

/**
 * State for the passwordless magic-link request form. `sent` is deliberately
 * returned for BOTH a successful send and any non-429 failure, so the response
 * can never be used to probe whether an account exists (anti-enumeration).
 */
export type OtpState =
  | { status: 'idle' }
  | { status: 'sent'; email: string }
  | { status: 'error'; error: 'rateLimited' | 'invalid_email' | 'generic' }
  | null;

/**
 * Sends a Supabase magic-link (OTP) to `email`. The confirmation link points at
 * `/auth/confirm` WITHOUT a `next` param: forcing `?next=/me` would send staff
 * to /me, so with no `next` the shared post-auth resolver routes each user by
 * role (staff → /dashboard, customer → /me).
 *
 * Anti-enumeration: apart from a 429 rate-limit, the action always resolves to
 * `sent` — it never branches on whether a customers/user row exists.
 */
export async function requestOtpAction(
  _prev: OtpState,
  formData: FormData,
): Promise<OtpState> {
  const parsed = otpSchema.safeParse(formData.get('email'));
  if (!parsed.success) return { status: 'error', error: 'invalid_email' };
  const email = parsed.data;

  // Tenant context (the subdomain the user is browsing)
  const tenantSlug = (await headers()).get('x-tenant-slug') ?? '';
  if (!tenantSlug) return { status: 'error', error: 'generic' };

  const supabase = await createSupabaseServerClient();
  const emailRedirectTo = `${buildTenantOrigin(tenantSlug)}/auth/confirm`;

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo, shouldCreateUser: true },
  });

  // Rate limit is the only outcome that changes the response.
  if (error?.status === 429) return { status: 'error', error: 'rateLimited' };

  // Success OR any other (non-429) error resolves identically.
  return { status: 'sent', email };
}
