// ── Serialized type for one week day (RSC → Client boundary) ──

export type WeekDaySer = {
  dateIso:          string;
  businessStart:    string;   // "HH:MM:SS"
  businessEnd:      string;
  isOpen:           boolean;
  appointments:     Array<{
    id: string; startAt: string; endAt: string;
    status: string; customerName: string; serviceName: Record<string, string>;
  }>;
  blockedIntervals: Array<{ id: string; startAt: string; endAt: string; reason: string }>;
};

// ── Helpers ──────────────────────────────────────────────────

export function getWeekDays(weekStart: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setUTCDate(d.getUTCDate() + i);
    return d;
  });
}

export function isToday(d: Date): boolean {
  const now = new Date();
  return d.getUTCFullYear() === now.getFullYear() &&
         d.getUTCMonth()    === now.getMonth()    &&
         d.getUTCDate()     === now.getDate();
}

export function fmtTime(d: Date): string {
  return d.toISOString().slice(11, 16);
}

export const DAY_LABELS: Record<string, string[]> = {
  es: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'],
  pt: ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'],
  en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
};
