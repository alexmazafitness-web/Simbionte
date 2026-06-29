// Motor de recurrencia — traducción literal de recurOccursOn/_recurEndISO
// de reference/segundo-cerebro.html. Es una REGLA, no una lista de instancias:
// dado un día concreto se decide si "ocurre" o no, en vez de generar eventos.

import { addDaysISO } from "./format";

export type EndType = "never" | "until" | "count";

export type RecurRule = {
  days: number[]; // 0=domingo … 6=sábado
  start: string | null; // ISO, null = sin tope inferior
  endType: EndType;
  until?: string | null; // ISO, solo si endType === 'until'
  count?: number | null; // solo si endType === 'count'
  exceptDates?: string[]; // ISO dates where this block is suppressed (one-off exceptions)
};

export function recurEndISO(r: RecurRule | null): string | null {
  if (!r) return null;
  if (r.endType === "until") return r.until || null;
  if (r.endType === "count") {
    const days = r.days?.length ? r.days : [];
    if (!days.length || !r.start) return r.start || null;
    let iso = r.start;
    let n = 0;
    let last = r.start;
    let guard = 0;
    while (n < (r.count ?? 0) && guard < 4000) {
      const dow = new Date(iso + "T00:00:00").getDay();
      if (days.includes(dow)) {
        n++;
        last = iso;
      }
      iso = addDaysISO(iso, 1);
      guard++;
    }
    return last;
  }
  return null;
}

export function recurOccursOn(r: RecurRule | null, iso: string, dow: number): boolean {
  if (!r) return false;
  const days = r.days?.length ? r.days : [];
  if (!days.length) return false;
  if (!days.includes(dow)) return false;
  if (r.start && iso < r.start) return false;
  const end = recurEndISO(r);
  if (end && iso > end) return false;
  if (r.exceptDates?.includes(iso)) return false;
  return true;
}

export function recurLabel(r: RecurRule | null, daysSh: string[]): string {
  if (!r || !r.days?.length) return "";
  const ord = [...r.days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  const dl = ord.length === 7 ? "Todos los días" : ord.map((d) => daysSh[d]).join("/");
  let end = "";
  if (r.endType === "until" && r.until) {
    const d = new Date(r.until + "T00:00:00");
    end = " · hasta " + d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
  } else if (r.endType === "count" && r.count) {
    end = " · " + r.count + "×";
  }
  return dl + end;
}
