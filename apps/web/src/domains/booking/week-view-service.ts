import 'server-only';

import { getDayView } from './day-view-service';
import type { DayViewData } from './day-view-service';
import type { Result } from '@/shared/types/result';

export type { DayViewData };

/**
 * getWeekView — fetches DayViewData for 7 consecutive days (Mon → Sun).
 *
 * Accepts any date within the target week; normalises to Monday UTC.
 * Tenant isolation is guaranteed inside each getDayView call (orgId filter).
 */
export async function getWeekView(
  orgId:     string,
  weekStart: Date,
): Promise<Result<DayViewData[]>> {
  // Normalise to Monday (UTC)
  const monday = new Date(weekStart);
  const dow = monday.getUTCDay();
  monday.setUTCDate(monday.getUTCDate() + (dow === 0 ? -6 : 1 - dow));
  monday.setUTCHours(0, 0, 0, 0);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });

  try {
    const results = await Promise.all(days.map(d => getDayView(orgId, d)));
    const failing = results.find(r => r.error);
    if (failing) return { data: null, error: failing.error ?? { message: 'Failed to load day', code: 'DB_ERROR' } };
    return { data: results.map(r => r.data!), error: null };
  } catch {
    return { data: null, error: { message: 'Failed to load week view', code: 'DB_ERROR' } };
  }
}
