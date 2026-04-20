/** Premium shimmer skeleton for the patient record page. */
export function PatientSkeleton() {
  return (
    <div className="space-y-10 animate-pulse" aria-busy="true" aria-label="Cargando expediente">
      {/* Header */}
      <div className="rounded-sm border border-[var(--color-spa-border)] bg-white/50 p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="skeleton-shimmer w-16 h-16 rounded-sm flex-shrink-0" />
          <div className="flex-1 space-y-2.5">
            <div className="skeleton-shimmer h-5 w-48 rounded-sm" />
            <div className="skeleton-shimmer h-3 w-32 rounded-sm" />
            <div className="skeleton-shimmer h-3 w-40 rounded-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2 border-t border-[var(--color-spa-border)]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="skeleton-shimmer h-2 w-16 rounded-sm" />
              <div className="skeleton-shimmer h-3 w-24 rounded-sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4">
        <div className="skeleton-shimmer h-4 w-32 rounded-sm" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="skeleton-shimmer w-10 h-10 rounded-sm flex-shrink-0" />
            <div className="flex-1 rounded-sm border border-[var(--color-spa-border)] bg-white/40 p-4 space-y-2">
              <div className="skeleton-shimmer h-4 w-40 rounded-sm" />
              <div className="skeleton-shimmer h-3 w-28 rounded-sm" />
            </div>
          </div>
        ))}
      </div>

      {/* Gallery */}
      <div className="space-y-3">
        <div className="skeleton-shimmer h-4 w-28 rounded-sm" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton-shimmer rounded-sm" style={{ aspectRatio: '3/4' }} />
          ))}
        </div>
      </div>
    </div>
  );
}
