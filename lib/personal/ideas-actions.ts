"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { Front } from "./constants";

const PATH = "/personal/cerebro/ideas";

export async function crearIdea(text: string, front: Front) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("ideas").insert({
    owner_id: ownerId,
    title: text,
    front,
    status: "abierta",
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function archivarIdea(id: string, archivar: boolean) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("ideas")
    .update({ status: archivar ? "archivada" : "abierta" })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarIdea(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("ideas").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// Crea una tarea sin fecha a partir del texto de la idea y borra la idea
// (igual que ideaToTask() del HTML: la idea no se archiva, se consume).
export async function convertirIdeaATarea(id: string, text: string, front: Front) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const { error: taskError } = await supabase.schema("personal").from("tasks").insert({
    owner_id: ownerId,
    title: text,
    front,
    is_priority: false,
    due_date: null,
    recur: null,
  });
  if (taskError) throw taskError;

  const { error: deleteError } = await supabase.schema("personal").from("ideas").delete().eq("id", id);
  if (deleteError) throw deleteError;

  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
  revalidatePath("/personal/cerebro/tareas");
}
