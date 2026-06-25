import type { Front } from "./constants";

export type ReminderVM = {
  id: string;
  text: string;
  whenISO: string; // timestamptz ISO completo (fecha+hora)
  front: Front;
  done: boolean;
};

// Recordatorios de hoy sin completar — para la portada "Hoy". No existía
// ninguna vista "de hoy" para recordatorios (Mi día no los muestra).
export function recordatoriosHoy(reminders: ReminderVM[]): ReminderVM[] {
  const hoy = new Date().toDateString();
  return reminders
    .filter((r) => !r.done && new Date(r.whenISO).toDateString() === hoy)
    .sort((a, b) => a.whenISO.localeCompare(b.whenISO));
}
