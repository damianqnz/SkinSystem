export const GRID_START_HOUR = 0;
export const GRID_END_HOUR   = 24;
export const TOTAL_HOURS     = 24;
export const PX_PER_MIN      = 2;
export const TOTAL_PX        = TOTAL_HOURS * 60 * PX_PER_MIN;
export const HOUR_PX         = 60 * PX_PER_MIN;

export const HOUR_LABELS = Array.from({ length: TOTAL_HOURS }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`
);
