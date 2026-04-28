/**
 * AgendaSkeleton — shimmer for the month grid while events stream in.
 * Mirrors the 7-col header + 6-row body layout of MonthView.
 */
export function AgendaSkeleton() {
  return (
    <div className="flex-1 flex flex-col min-h-0" aria-busy="true" aria-label="Cargando calendário">
      {/* Day-of-week header row */}
      <div className="grid grid-cols-7 border-b border-spa-border bg-white shrink-0">
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className="px-3 py-2 border-r border-spa-border last:border-r-0"
          >
            <div className="skeleton-shimmer h-2.5 w-10 rounded-sm" />
          </div>
        ))}
      </div>

      {/* 6×7 cells */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 min-h-0">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="min-h-[110px] flex flex-col gap-2 p-2 border-r border-b border-spa-border last:border-r-0 bg-white"
          >
            <div className="skeleton-shimmer h-3 w-4 rounded-sm" />
            {/* 0-2 placeholder chips per cell, deterministic from index */}
            {i % 3 !== 0 && <div className="skeleton-shimmer h-3 w-4/5 rounded-sm" />}
            {i % 5 === 0 && <div className="skeleton-shimmer h-3 w-3/5 rounded-sm" />}
          </div>
        ))}
      </div>
    </div>
  );
}
