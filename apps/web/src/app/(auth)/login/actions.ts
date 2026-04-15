'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { createSupabaseServerClient } from '@/infrastructure/supabase/server';
import { db } from '@/infrastructure/db';
import { profiles, organizations } from '@/infrastructure/db/schema/organizations';

// ── Validation ────────────────────────────────────────────────────
const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(6),
  next:     z.string().optional(),
});

export type LoginState = { error: keyof AuthErrors } | null;
type AuthErrors = {
  invalid_credentials: string;
  no_profile: string;
  generic: string;
};

// ── Action ────────────────────────────────────────────────────────
/**
 * Server Action: email/password sign-in via Supabase PKCE-ready client.
 * On success, redirects to the user's organisation subdomain dashboard.
 * On failure, returns a typed error key for the client to display.
 */
export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  // 1. Validate input
  const parsed = loginSchema.safeParse({
    email:    formData.get('email'),
    password: formData.get('password'),
    next:     formData.get('next') ?? undefined,
  });

  if (!parsed.success) {
    return { error: 'invalid_credentials' };
  }

  const { email, password, next } = parsed.data;

  // 2. Sign in with Supabase (sets session cookies via SSR client)
  const supabase = await createSupabaseServerClient();
  const { error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError) {
    return { error: 'invalid_credentials' };
  }

  // 3. Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: 'generic' };

  // 4. Resolve org slug from profile
  const [row] = await db
    .select({ slug: organizations.slug })
    .from(profiles)
    .innerJoin(organizations, eq(profiles.organizationId, organizations.id))
    .where(eq(profiles.id, user.id))
    .limit(1);

  if (!row) return { error: 'no_profile' };

  // 5. Build redirect URL — safe cross-subdomain redirect
  const targetUrl = resolveRedirectUrl(next, row.slug);

  // redirect() throws a special Next.js error — must be outside try/catch
  redirect(targetUrl);
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Resolves the post-login redirect URL.
 * Validates the `next` param against the user's org slug to prevent open redirects.
 */
function resolveRedirectUrl(next: string | undefined, orgSlug: string): string {
  const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN ?? 'skinsystem.pt';
  const isLocal    = process.env.NODE_ENV !== 'production';
  const protocol   = isLocal ? 'http' : 'https';
  const host       = isLocal ? `${orgSlug}.lvh.me:3000` : `${orgSlug}.${baseDomain}`;
  const defaultUrl = `${protocol}://${host}/dashboard`;

  if (!next) return defaultUrl;

  // Validate: the `next` URL must belong to this org's subdomain
  try {
    const url     = new URL(next);
    const allowed = [
      `${orgSlug}.${baseDomain}`,
      `${orgSlug}.lvh.me`,
    ];
    if (allowed.includes(url.hostname)) return next;
  } catch {
    // Invalid URL — fall through to default
  }

  return defaultUrl;
}
