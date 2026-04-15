import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Utility for merging Tailwind CSS classes without conflicts.
 * Used by all Shadcn/ui and MagicUI components.
 *
 * @example cn('px-4 py-2', condition && 'bg-stone-900', 'text-white')
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
