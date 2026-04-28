/**
 * Admin script: reset a Supabase Auth user's password by UID.
 * Runs in raw Node.js via tsx — NOT a Next.js Server Action.
 *
 * Usage (from apps/web):
 *   pnpm reset-password <uid> <newPassword>
 *
 * Requires .env.local with:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

// ── Types ─────────────────────────────────────────────────────────
type AppError = { message: string; code: string };
type Result<T> = { data: T; error: null } | { data: null; error: AppError };

// ── Validation ────────────────────────────────────────────────────
// Supabase seed UIDs use non-RFC-4122 patterns (e.g. b1000000-...-0001),
// so we validate the hex format only, not the version/variant bits.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const argsSchema = z.object({
  uid: z.string().regex(UUID_RE, 'uid must be a valid UUID (8-4-4-4-12 hex format)'),
  password: z
    .string()
    .min(8,          'min 8 characters')
    .regex(/[A-Z]/,  'must contain uppercase')
    .regex(/[a-z]/,  'must contain lowercase')
    .regex(/[0-9]/,  'must contain a digit')
    .regex(/[^A-Za-z0-9]/, 'must contain a symbol'),
});

// ── Admin client (no server-only — this runs outside Next.js) ─────
function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
}

// ── Domain logic ──────────────────────────────────────────────────
async function resetPassword(uid: string, newPassword: string): Promise<Result<{ id: string; email: string | null }>> {
  const parsed = argsSchema.safeParse({ uid, password: newPassword });
  if (!parsed.success) {
    return { data: null, error: { code: 'invalid_input', message: parsed.error.message } };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(
    parsed.data.uid,
    { password: parsed.data.password },
  );

  if (error) {
    return { data: null, error: { code: 'supabase_error', message: error.message } };
  }

  return { data: { id: data.user.id, email: data.user.email ?? null }, error: null };
}

// ── CLI entrypoint ────────────────────────────────────────────────
async function main(): Promise<void> {
  const [, , uidArg, passwordArg] = process.argv;

  if (!uidArg || !passwordArg) {
    console.error('Usage: pnpm reset-password <uid> <newPassword>');
    process.exit(1);
  }

  const result = await resetPassword(uidArg, passwordArg);

  if (result.error) {
    console.error(`[FAIL] ${result.error.code}: ${result.error.message}`);
    process.exit(1);
  }

  console.log(`[OK] Password updated for ${result.data.email ?? result.data.id}`);
}

void main();
