export function CalendarSkeleton() {
  return (
    <div className="flex flex-col min-h-0">
      {/* Stats bar skeleton */}
      <div className="flex items-center gap-6 px-4 py-2 border-b border-stone-100">
        {[64, 52, 48].map((w, i) => (
          <div key={i} className={`skeleton-shimmer h-3 rounded`} style={{ width: w }} />
        ))}
      </div>

      {/* Legend skeleton */}
      <div className="flex gap-4 px-4 py-2 border-b border-stone-100">
        {[5].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="skeleton-shimmer w-2 h-2 rounded-full" />
            <div className="skeleton-shimmer h-2 w-12 rounded" />
          </div>
        ))}
      </div>

      {/* Slot rows */}
      <div className="px-2 py-3 space-y-3">
        {Array.from({ length: 4 }, (_, h) => (
          <div key={h}>
            <div className="flex items-center gap-2 mb-1 px-1">
              <div className="skeleton-shimmer h-2.5 w-8 rounded" />
              <div className="skeleton-shimmer h-px flex-1" />
            </div>
            <div className="space-y-0.5">
              {Array.from({ length: 3 + (h % 2)}, (_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer rounded-md"
                  style={{ height: 28, marginLeft: 4, marginRight: 4 }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
