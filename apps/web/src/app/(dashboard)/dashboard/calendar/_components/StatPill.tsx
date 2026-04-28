export function StatPill({ value, label, color }: { value: number; label: string; color: string; }) {
  return (
    <div className="flex items-baseline gap-1">
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
      <span className="text-[10px] text-stone-400 uppercase tracking-wide">{label}</span>
    </div>
  );
}
