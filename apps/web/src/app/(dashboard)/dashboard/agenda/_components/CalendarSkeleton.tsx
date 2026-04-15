export function CalendarSkeleton() {
  return (
    <div className="flex-1 overflow-hidden">
      {/* Desktop week grid skeleton */}
      <div className="hidden md:flex" style={{ height: 'calc(100vh - 200px)' }}>
        {/* Hour gutter */}
        <div className="w-14 flex-shrink-0 pt-4 space-y-8 pr-2">
          {Array.from({ length: 7 }, (_, i) => (
            <div key={i} className="skeleton-shimmer h-3 rounded w-10 ml-auto" />
          ))}
        </div>
        {/* Columns */}
        <div className="flex-1 grid grid-cols-7 gap-px bg-stone-100">
          {Array.from({ length: 7 }, (_, day) => (
            <div key={day} className="bg-white relative">
              {Array.from({ length: 3 }, (_, i) => (
                <div
                  key={i}
                  className="skeleton-shimmer mx-1 rounded-md"
                  style={{
                    position: 'absolute',
                    top:   60 + i * 160 + day * 30,
                    left:  4,
                    right: 4,
                    height: 80 + (i % 2) * 40,
                  }}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Mobile list skeleton */}
      <div className="md:hidden divide-y divide-stone-100">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="px-4 py-3.5">
            <div className="skeleton-shimmer h-3 w-20 rounded mb-3" />
            <div className="flex items-start gap-3">
              <div className="skeleton-shimmer h-8 w-10 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton-shimmer h-3.5 w-32 rounded" />
                <div className="skeleton-shimmer h-3 w-24 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
