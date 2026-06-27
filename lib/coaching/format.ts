const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function addDaysISO(iso: string, days: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function diffDiasDesdeHoy(iso: string | null): number | null {
  if (!iso) return null;
  const target = new Date(iso + "T00:00:00");
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - hoy.getTime()) / 86_400_000);
}

export function fmtDateCorta(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function iniciales(nombre: string): string {
  if (nombre.includes(", ")) {
    const [apellidos, nom] = nombre.split(", ", 2);
    return ((nom?.[0] ?? "") + (apellidos?.[0] ?? "")).toUpperCase();
  }
  const partes = nombre.trim().split(/\s+/);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

// Meses de permanencia entre dos fechas ISO, con un decimal y coma española ("12,4").
export function permanenciaMeses(fechaAltaISO: string | null, hastaISO?: string): string {
  if (!fechaAltaISO) return "0,0";
  const alta = new Date(fechaAltaISO + "T00:00:00");
  const hasta = hastaISO ? new Date(hastaISO + "T00:00:00") : new Date();
  const dias = Math.max(0, (hasta.getTime() - alta.getTime()) / 86_400_000);
  const meses = dias / 30.44;
  return meses.toFixed(1).replace(".", ",");
}

export function formatEUR(valor: number): string {
  return `${Math.round(valor)} €`;
}

export function formatEURDecimal(valor: number): string {
  return valor.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
