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
