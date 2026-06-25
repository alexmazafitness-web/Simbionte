import { createClient } from "@/lib/supabase/server";
import type { Front } from "./constants";
import type { RecurRule } from "./recurrence";
import type { TaskVM } from "./tasks";

type TaskRow = {
  id: string;
  title: string;
  front: Front;
  is_priority: boolean;
  due_date: string | null;
  recur: RecurRule | null;
  done: boolean;
  done_at: string | null;
  done_dates: string[] | null;
};

function shape(row: TaskRow): TaskVM {
  return {
    id: row.id,
    title: row.title,
    front: row.front,
    isPriority: row.is_priority,
    date: row.due_date,
    recur: row.recur,
    done: row.done,
    doneAt: row.done_at,
    doneDates: row.done_dates ?? [],
  };
}

export async function listTasks(): Promise<TaskVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("tasks")
    .select("id, title, front, is_priority, due_date, recur, done, done_at, done_dates")
    .order("created_at");

  if (error) throw error;
  return (data as TaskRow[]).map(shape);
}
