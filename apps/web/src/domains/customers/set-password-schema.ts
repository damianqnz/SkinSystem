import { z } from 'zod';

/**
 * @file set-password-schema.ts
 * @description Pure client-side validation for `SetPasswordForm` (PR D.2,
 *              design section 4.3 "residual affordance"). No `server-only`,
 *              no DB import — this is form validation only; the actual write
 *              happens via `supabase.auth.updateUser({ password })` from the
 *              browser client against the already-authenticated session.
 *
 *              Minimum length is aligned with Supabase Auth's own default
 *              (6 characters), the same bound `loginSchema` in
 *              `(auth)/login/actions.ts` already enforces for sign-in — a
 *              password this schema accepts is never rejected server-side
 *              purely for length. Supabase's `weak_password` check (Leaked
 *              Password Protection, PR G, deferred on the Free plan) is a
 *              separate server-side check this schema cannot replicate; it
 *              is mapped from `updateUser`'s error response instead, in
 *              `SetPasswordForm`.
 */
export const PASSWORD_MIN_LENGTH = 6;

export const setPasswordSchema = z
  .object({
    password:        z.string().min(PASSWORD_MIN_LENGTH),
    confirmPassword: z.string().min(PASSWORD_MIN_LENGTH),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path:    ['confirmPassword'],
    message: 'mismatch',
  });

export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
