import type { Front } from "./constants";

export type ReminderVM = {
  id: string;
  text: string;
  whenISO: string; // timestamptz ISO completo (fecha+hora)
  front: Front;
  done: boolean;
};
