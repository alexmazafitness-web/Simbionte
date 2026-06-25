"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/personal/cerebro/knowledge";

export async function crearCategoria(emoji: string, name: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_categories").insert({ owner_id: ownerId, emoji, name });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarCategoria(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// Nota: el HTML de referencia no tiene un modal manual para crear notas —
// la única vía es la IA (desactivada en esta fase), así que este modal
// manual es necesario para que la entidad sea utilizable.
export async function crearNota(title: string, text: string, source: string, categoryId: string | null) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_notes").insert({
    owner_id: ownerId,
    title,
    content: text || null,
    source: source || null,
    category_id: categoryId,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarNota(id: string, title: string, text: string, source: string, categoryId: string | null) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("kn_notes")
    .update({ title, content: text || null, source: source || null, category_id: categoryId })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarNota(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_notes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function crearPrincipio(text: string, source: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_principles").insert({ owner_id: ownerId, content: text, source: source || null });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarPrincipio(id: string, text: string, source: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("kn_principles")
    .update({ content: text, source: source || null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarPrincipio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_principles").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function crearSistema(name: string, desc: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_systems").insert({ owner_id: ownerId, title: name, content: desc || null });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarSistema(id: string, name: string, desc: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("kn_systems")
    .update({ title: name, content: desc || null })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarSistema(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_systems").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
