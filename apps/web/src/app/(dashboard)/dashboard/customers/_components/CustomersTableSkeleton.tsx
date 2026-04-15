/** Shimmer skeleton shown while the customer list is loading via Suspense. */
export function CustomersTableSkeleton() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Cargando clientes">
      {/* Fake search bar */}
      <div className="skeleton-shimmer h-10 w-full rounded-sm mb-6" />

      {/* Fake table */}
      <div className="rounded-sm border border-[var(--color-spa-border)] overflow-hidden">
        {/* Header */}
        <div className="flex gap-4 px-5 py-3 bg-[var(--color-spa-bg)] border-b border-[var(--color-spa-border)]">
          <div className="skeleton-shimmer h-2.5 w-20 rounded-sm" />
          <div className="skeleton-shimmer h-2.5 w-20 rounded-sm hidden md:block" />
          <div className="skeleton-shimmer h-2.5 w-28 rounded-sm hidden md:block" />
          <div className="skeleton-shimmer h-2.5 w-14 rounded-sm ml-auto" />
        </div>

        {/* Rows */}
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3.5 border-b border-[var(--color-spa-border)] last:border-0"
          >
            <div className="skeleton-shimmer w-9 h-9 rounded-sm flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="skeleton-shimmer h-3 w-36 rounded-sm" />
              <div className="skeleton-shimmer h-2.5 w-24 rounded-sm" />
            </div>
            <div className="skeleton-shimmer h-2.5 w-16 rounded-sm hidden md:block" />
            <div className="skeleton-shimmer h-2.5 w-32 rounded-sm hidden md:block" />
            <div className="skeleton-shimmer h-5 w-16 rounded-full ml-auto md:ml-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
