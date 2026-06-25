const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function todayISO(): string {
  return toISO(new Date());
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toISO(d);
}

export function dowOf(iso: string): number {
  return new Date(iso + "T00:00:00").getDay();
}

export function fmtDateCorta(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function diffDiasDesdeHoy(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - hoy.getTime()) / 86_400_000);
}

export function minToStr(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMin(str: string): number {
  const [h, m] = str.split(":").map(Number);
  return h * 60 + m;
}

// Lunes de la semana que contiene `iso` (o hoy si se omite).
export function mondayOfWeek(iso?: string): string {
  const d = iso ? new Date(iso + "T00:00:00") : new Date();
  const cur = d.getDay();
  const monOffset = cur === 0 ? -6 : 1 - cur;
  d.setDate(d.getDate() + monOffset);
  return toISO(d);
}
