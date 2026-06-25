"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { Front } from "./constants";
import type { RecurRule } from "./recurrence";
import { todayISO } from "./format";

const PATH = "/personal/cerebro";

export type TareaInput = {
  title: string;
  front: Front;
  isPriority: boolean;
  date: string | null;
  recur: RecurRule | null;
};

export async function crearTarea(input: TareaInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("tasks").insert({
    owner_id: ownerId,
    title: input.title,
    front: input.front,
    is_priority: input.isPriority,
    due_date: input.date,
    recur: input.recur,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarTarea(id: string, input: TareaInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("tasks")
    .update({
      title: input.title,
      front: input.front,
      is_priority: input.isPriority,
      due_date: input.date,
      recur: input.recur,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarTarea(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("tasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// Alterna el completado de UNA ocurrencia (iso) si la tarea es recurrente,
// o el flag simple `done` si no lo es — igual que setTaskDoneOn() del HTML.
export async function marcarTareaHecha(id: string, esRecurrente: boolean, iso: string, valor: boolean) {
  const supabase = await createClient();

  if (esRecurrente) {
    const { data: tarea, error: fetchError } = await supabase
      .schema("personal")
      .from("tasks")
      .select("done_dates")
      .eq("id", id)
      .single();
    if (fetchError) throw fetchError;

    const actuales: string[] = tarea.done_dates ?? [];
    const doneDates = valor ? [...new Set([...actuales, iso])] : actuales.filter((d) => d !== iso);

    const { error } = await supabase.schema("personal").from("tasks").update({ done_dates: doneDates }).eq("id", id);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .schema("personal")
      .from("tasks")
      .update({ done: valor, done_at: valor ? todayISO() : null })
      .eq("id", id);
    if (error) throw error;
  }

  revalidatePath(PATH);
}
