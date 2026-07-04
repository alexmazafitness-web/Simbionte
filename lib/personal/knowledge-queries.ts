import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { KN_CATS_DEFAULT } from "./constants";
import type { KnCategoryVM, KnNoteVM, KnPrincipleVM, KnSystemVM, FuenteTipo, FuenteLongitud, SesionPausadaVM } from "./knowledge";

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
    .select("id, title, content, source, category_id, nota_bruta, fuente_tipo, fuente_nombre, fuente_longitud, puntos_clave, url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id:             row.id,
    title:          row.title,
    text:           row.content ?? null,
    notaBruta:      (row as any).nota_bruta ?? null,
    fuenteTipo:     ((row as any).fuente_tipo as FuenteTipo | null) ?? null,
    fuenteNombre:   (row as any).fuente_nombre ?? "",
    fuenteLongitud: (((row as any).fuente_longitud as FuenteLongitud | null) ?? "corta"),
    puntosClave:    Array.isArray((row as any).puntos_clave) ? (row as any).puntos_clave as string[] : [],
    source:         row.source ?? null,
    categoryId:     row.category_id ?? null,
    url:            (row as any).url ?? null,
    createdAt:      row.created_at,
  }));
}

// Sesiones "en_progreso" (guardadas y no procesadas), agrupadas por sesion_id.
export async function listSesionesPausadas(): Promise<SesionPausadaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("knowledge_sesion_notas")
    .select("id, sesion_id, contenido, orden, created_at, estado, fuente_tipo, fuente_nombre, url, categoria_id")
    .eq("estado", "en_progreso")
    .order("orden", { ascending: true });
  if (error) throw error;

  const bySesion = new Map<string, SesionPausadaVM>();
  for (const row of data) {
    let s = bySesion.get(row.sesion_id);
    if (!s) {
      s = {
        sesionId:     row.sesion_id,
        fuenteTipo:   (row.fuente_tipo as FuenteTipo | null) ?? null,
        fuenteNombre: row.fuente_nombre ?? "",
        url:          row.url ?? null,
        categoriaId:  row.categoria_id ?? null,
        notas:        [],
        updatedAt:    row.created_at,
      };
      bySesion.set(row.sesion_id, s);
    }
    s.notas.push({ id: row.id, contenido: row.contenido, orden: row.orden, createdAt: row.created_at });
    if (row.created_at > s.updatedAt) s.updatedAt = row.created_at;
  }
  return [...bySesion.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
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
