export function CatalogSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div className="space-y-2">
          <div className="skeleton-shimmer h-7 w-32 rounded" />
          <div className="skeleton-shimmer h-3 w-48 rounded" />
        </div>
        <div className="skeleton-shimmer h-9 w-36 rounded-xl" />
      </div>

      {/* Islands */}
      {[3, 2, 4].map((rows, i) => (
        <div key={i} className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-5 py-4">
            <div className="flex-1 space-y-1.5">
              <div className="skeleton-shimmer h-4 w-28 rounded" />
              <div className="skeleton-shimmer h-2.5 w-40 rounded" />
            </div>
            <div className="skeleton-shimmer h-3 w-16 rounded" />
          </div>

          <div className="h-px bg-stone-100 mx-5" />

          {/* Table rows */}
          <div className="divide-y divide-stone-50">
            {Array.from({ length: rows }, (_, j) => (
              <div key={j} className="flex items-center gap-4 px-4 py-3.5">
                <div className="flex items-center gap-3 flex-1">
                  <div className="skeleton-shimmer w-2 h-2 rounded-full" />
                  <div className="skeleton-shimmer h-4 rounded" style={{ width: 80 + j * 30 }} />
                </div>
                <div className="skeleton-shimmer h-3.5 w-14 rounded hidden sm:block" />
                <div className="skeleton-shimmer h-3 w-12 rounded hidden sm:block" />
                <div className="skeleton-shimmer h-5 w-14 rounded-full hidden sm:block" />
              </div>
            ))}
          </div>

          <div className="px-4 py-3 border-t border-stone-50">
            <div className="skeleton-shimmer h-3 w-28 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
