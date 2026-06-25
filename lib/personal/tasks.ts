import type { Front } from "./constants";
import { recurOccursOn, type RecurRule } from "./recurrence";

export type TaskVM = {
  id: string;
  title: string;
  front: Front;
  isPriority: boolean;
  date: string | null; // fecha puntual; si está presente, no es recurrente
  recur: RecurRule | null;
  done: boolean; // solo aplica si no es recurrente
  doneAt: string | null;
  doneDates: string[]; // ISOs completados, solo si es recurrente
};

export function taskOccursOn(t: TaskVM, iso: string, dow: number): boolean {
  if (t.date) return t.date === iso;
  return t.recur ? recurOccursOn(t.recur, iso, dow) : false;
}

export function taskDoneOn(t: TaskVM, iso: string): boolean {
  if (t.recur) return t.doneDates.includes(iso);
  return t.done;
}

// "Mi día": una tarea con fecha puntual VENCIDA sigue apareciendo hasta
// completarse (no solo el día exacto) — distinto de taskOnDatePending.
export function taskShowToday(t: TaskVM, iso: string, dow: number): boolean {
  if (taskDoneOn(t, iso)) return false;
  if (t.isPriority) return true;
  if (t.date) return t.date <= iso;
  return t.recur ? recurOccursOn(t.recur, iso, dow) : false;
}

// Calendario: solo el día exacto en que ocurre, y solo si no está completada.
export function taskOnDatePending(t: TaskVM, iso: string, dow: number): boolean {
  if (taskDoneOn(t, iso)) return false;
  return taskOccursOn(t, iso, dow);
}
