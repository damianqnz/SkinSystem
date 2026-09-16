// Positional lookup keys for the `calendar.months`/`calendar.days` message
// namespace (named keys, per the "never indexed arrays" rule) — bridges
// grid/positional rendering (month index 0-11, weekday index 0-6) back to
// the translated label.

export const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
] as const;
export type MonthKey = typeof MONTH_KEYS[number];

export const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;
export type DayKey = typeof DAY_KEYS[number];

/** DAY_KEYS rotated to start on Monday, for week-grid header consumers. */
export const MONDAY_FIRST_DAY_KEYS: readonly DayKey[] = [...DAY_KEYS.slice(1), DAY_KEYS[0]];
