import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { KN_CATS_DEFAULT } from "./constants";
import type { KnCategoryVM, KnNoteVM, KnPrincipleVM, KnSystemVM, FuenteTipo } from "./knowledge";

export async function listKnCategories(): Promise<KnCategoryVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("personal").from("kn_categories").select("id, emoji, name").order("name");
  if (error) throw error;

  if (data.length > 0) return data;

  const ownerId = await requireUserId(supabase);
  const { data: seeded, error: seedError } = await supabase
    .schema("personal")
    .from("kn_categories")
    .insert(KN_CATS_DEFAULT.map((c) => ({ owner_id: ownerId, emoji: c.emoji, name: c.name })))
    .select("id, emoji, name");
  if (seedError) throw seedError;

  return seeded;
}

export async function listKnNotes(): Promise<KnNoteVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("kn_notes")
    .select("id, title, content, source, category_id, nota_bruta, fuente_tipo, fuente_nombre, puntos_clave, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id:           row.id,
    title:        row.title,
    text:         row.content ?? null,
    notaBruta:    (row as any).nota_bruta ?? null,
    fuenteTipo:   ((row as any).fuente_tipo as FuenteTipo | null) ?? null,
    fuenteNombre: (row as any).fuente_nombre ?? "",
    puntosClave:  Array.isArray((row as any).puntos_clave) ? (row as any).puntos_clave as string[] : [],
    source:       row.source ?? null,
    categoryId:   row.category_id ?? null,
    createdAt:    row.created_at,
  }));
}

export async function listKnPrinciples(): Promise<KnPrincipleVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("kn_principles")
    .select("id, content, source")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({ id: row.id, text: row.content, source: row.source }));
}

export async function listKnSystems(): Promise<KnSystemVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("kn_systems")
    .select("id, title, content")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({ id: row.id, name: row.title, desc: row.content }));
}
