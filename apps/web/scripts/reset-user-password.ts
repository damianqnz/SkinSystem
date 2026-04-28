/**
 * Admin script: reset a Supabase Auth user's password by UID.
 *
 * Usage:
 *   pnpm tsx apps/web/scripts/reset-user-password.ts <uid> <newPassword>
 *
 * Test user (Lourdes):
 *   pnpm tsx apps/web/scripts/reset-user-password.ts \
 *     b1000000-0000-0000-0000-000000000001 'Lourdes1234!'
 *
 * Loads SUPABASE_SERVICE_ROLE_KEY + NEXT_PUBLIC_SUPABASE_URL from the
 * environment (use `.env.local` + `dotenv -e .env.local --` or
 * `pnpm with-env`). Never commit credentials to the repo.
 *
 * Returns Result<{ id, email }> per CLAUDE.md §2 "Error Format".
 */

import { z } from 'zod';
import { createSupabaseAdminClient } from '@/infrastructure/supabase/admin';
import type { Result } from '@/shared/types/result';

// ── Validation ────────────────────────────────────────────────────
const argsSchema = z.object({
  uid: z.string().uuid('uid must be a valid UUID'),
  password: z
    .string()
    .min(8, 'password must be at least 8 characters')
    .regex(/[A-Z]/, 'password must contain an uppercase letter')
    .regex(/[a-z]/, 'password must contain a lowercase letter')
    .regex(/[0-9]/, 'password must contain a digit')
    .regex(/[^A-Za-z0-9]/, 'password must contain a symbol'),
});

type ResetOk = { id: string; email: string | null };

// ── Domain logic ──────────────────────────────────────────────────
async function resetPassword(
  uid: string,
  newPassword: string,
): Promise<Result<ResetOk>> {
  const parsed = argsSchema.safeParse({ uid, password: newPassword });
  if (!parsed.success) {
    return {
      data: null,
      error: { code: 'invalid_input', message: parsed.error.message },
    };
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.admin.updateUserById(
    parsed.data.uid,
    { password: parsed.data.password },
  );

  if (error) {
    return {
      data: null,
      error: { code: 'supabase_error', message: error.message },
    };
  }

  return {
    data: { id: data.user.id, email: data.user.email ?? null },
    error: null,
  };
}

// ── CLI entrypoint ────────────────────────────────────────────────
async function main(): Promise<void> {
  const [, , uidArg, passwordArg] = process.argv;

  if (!uidArg || !passwordArg) {
    console.error(
      'Usage: pnpm tsx apps/web/scripts/reset-user-password.ts <uid> <newPassword>',
    );
    process.exit(1);
  }

  const result = await resetPassword(uidArg, passwordArg);

  if (result.error) {
    console.error(`[FAIL] ${result.error.code}: ${result.error.message}`);
    process.exit(1);
  }

  console.log(
    `[OK] Password updated for ${result.data.email ?? result.data.id}`,
  );
}

void main();
