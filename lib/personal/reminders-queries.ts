import { createClient } from "@/lib/supabase/server";
import type { Front } from "./constants";
import type { ReminderVM } from "./reminders";

type ReminderRow = { id: string; title: string; remind_at: string; front: Front; done: boolean };

export async function listReminders(): Promise<ReminderVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("reminders")
    .select("id, title, remind_at, front, done")
    .order("done")
    .order("remind_at");

  if (error) throw error;
  return (data as ReminderRow[]).map((row) => ({
    id: row.id,
    text: row.title,
    whenISO: row.remind_at,
    front: row.front,
    done: row.done,
  }));
}
