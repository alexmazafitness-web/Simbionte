import type { Front } from "./constants";
import type { RecurRule } from "./recurrence";

export type EventBlockVM = {
  id: string;
  title: string;
  startMin: number;
  endMin: number;
  type: Front;
  notes: string | null;
  recur: RecurRule | null;
};

export type MarkedDateVM = {
  id: string;
  date: string;
  note: string | null;
};

// Evento de fecha única (no recurrente) — distinto de los bloques semanales
// de arriba. Usa las columnas start_at/end_at de personal.events, que
// existen desde la Fase 0 pero no se usaban hasta este puente.
export type EventoUnicoVM = {
  id: string;
  title: string;
  startAt: string; // timestamptz ISO
  endAt: string | null;
  type: Front;
  notes: string | null;
  allDay: boolean;
};
