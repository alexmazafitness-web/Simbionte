import { createClient } from "@/lib/supabase/server";
import type { Front } from "./constants";
import type { RecurRule } from "./recurrence";
import type { EventBlockVM, MarkedDateVM } from "./events";

type EventRow = {
  id: string;
  title: string;
  start_min: number;
  end_min: number;
  event_type: Front;
  description: string | null;
  recur: RecurRule | null;
};

export async function listEvents(): Promise<EventBlockVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("events")
    .select("id, title, start_min, end_min, event_type, description, recur")
    .order("start_min");

  if (error) throw error;
  return (data as EventRow[]).map((row) => ({
    id: row.id,
    title: row.title,
    startMin: row.start_min,
    endMin: row.end_min,
    type: row.event_type,
    notes: row.description,
    recur: row.recur,
  }));
}

type MarkRow = { id: string; date: string; label: string | null };

export async function listMarkedDates(): Promise<MarkedDateVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("personal").from("marked_dates").select("id, date, label").order("date");

  if (error) throw error;
  return (data as MarkRow[]).map((row) => ({ id: row.id, date: row.date, note: row.label }));
}
