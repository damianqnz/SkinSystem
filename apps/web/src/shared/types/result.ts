/**
 * Canonical Result pattern for all domain services.
 * Every function returns one of these two shapes — never throws.
 * Reference: CLAUDE.md §2 "Error Format".
 */

export type AppError = {
  message: string;
  code?: string;
};

export type Result<T> =
  | { data: T;    error: null }
  | { data: null; error: AppError };
