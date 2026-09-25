import { describe, expect, it } from 'vitest';
import { PASSWORD_MIN_LENGTH, setPasswordSchema } from './set-password-schema';

describe('setPasswordSchema', () => {
  it('accepts a matching password at exactly the minimum length', () => {
    const password = 'a'.repeat(PASSWORD_MIN_LENGTH);
    const result = setPasswordSchema.safeParse({ password, confirmPassword: password });
    expect(result.success).toBe(true);
  });

  it('rejects a password shorter than the minimum', () => {
    const password = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const result = setPasswordSchema.safeParse({ password, confirmPassword: password });
    expect(result.success).toBe(false);
  });

  it('rejects a confirmation that does not match the password', () => {
    const result = setPasswordSchema.safeParse({
      password:        'correct-horse',
      confirmPassword: 'wrong-horse',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['confirmPassword']);
      // `SetPasswordForm` distinguishes "mismatch" from "too short" by this
      // `code`, NOT by `path` alone -- a too-short `confirmPassword` also has
      // `path: ['confirmPassword']` (see the next test), so `code === 'custom'`
      // is the only reliable signal that the refine (not `.min()`) fired.
      expect(result.error.issues[0]?.code).toBe('custom');
    }
  });

  it('reports a too_small (not custom) issue when both fields are equal but too short', () => {
    const password = 'a'.repeat(PASSWORD_MIN_LENGTH - 1);
    const result = setPasswordSchema.safeParse({ password, confirmPassword: password });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((issue) => issue.code === 'custom')).toBe(false);
    }
  });

  it('rejects a missing confirmation field', () => {
    const result = setPasswordSchema.safeParse({ password: 'correct-horse' });
    expect(result.success).toBe(false);
  });
});
