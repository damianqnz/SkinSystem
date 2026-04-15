/**
 * AppointmentsSkeleton — premium shimmer skeleton shown while
 * AppointmentsList streams in via <Suspense>.
 */
export function AppointmentsSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-label="Cargando citas">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-5 py-4 rounded-sm border border-[var(--color-spa-border)] bg-white/40"
        >
          {/* Time block */}
          <div className="skeleton-shimmer w-11 h-11 rounded-sm flex-shrink-0" />

          {/* Name + service */}
          <div className="flex-1 space-y-2.5">
            <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
            <div className="skeleton-shimmer h-2.5 w-40 rounded-sm" />
          </div>

          {/* Status badge */}
          <div className="skeleton-shimmer h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
}
