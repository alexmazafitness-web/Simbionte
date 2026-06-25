"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { FaseId } from "./negocio-constants";

const PATH = "/coaching/negocio";

export async function crearTarjeta(faseId: FaseId) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { data, error } = await supabase
    .schema("coaching")
    .from("roadmap_items")
    .insert({ owner_id: ownerId, fase_id: faseId, tipo: "crear", titulo: "", descripcion: null, estado: "pendiente" })
    .select("id")
    .single();
  if (error) throw error;
  revalidatePath(PATH);
  return { id: data.id as string };
}

export async function editarTarjeta(id: string, titulo: string, nota: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("roadmap_items")
    .update({ titulo, descripcion: nota || null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarTarjeta(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("roadmap_items").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function crearSubtarea(itemId: string, orden: number) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("roadmap_subtasks").insert({
    owner_id: ownerId,
    item_id: itemId,
    texto: "",
    hecha: false,
    orden,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarSubtarea(id: string, texto: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("roadmap_subtasks").update({ texto }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function toggleSubtarea(id: string, hecha: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("roadmap_subtasks").update({ hecha }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarSubtarea(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("roadmap_subtasks").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
