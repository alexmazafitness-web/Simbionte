"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/personal/cerebro/knowledge";

// ── Categorías ────────────────────────────────────────────────────────────────

export async function crearCategoria(emoji: string, name: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_categories").insert({ owner_id: ownerId, emoji, name });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function renombrarCategoria(id: string, emoji: string, name: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_categories").update({ emoji, name }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarCategoria(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_categories").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// ── Notas ─────────────────────────────────────────────────────────────────────

export async function crearNotaIA(params: {
  title: string;
  contentProcesado: string;
  notaBruta: string;
  fuenteTipo: string;
  fuenteNombre: string;
  puntosClave: string[];
  categoryId: string | null;
  fuenteLongitud?: "corta" | "larga" | "sesion";
}) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const isLarga = params.fuenteLongitud === "larga";
  const { error } = await supabase.schema("personal").from("kn_notes").insert({
    owner_id:         ownerId,
    title:            params.title,
    content:          params.contentProcesado,
    nota_bruta:       isLarga ? null : (params.notaBruta || null),
    fuente_tipo:      params.fuenteTipo,
    fuente_nombre:    params.fuenteNombre,
    puntos_clave:     params.puntosClave,
    source:           params.fuenteNombre
      ? `${params.fuenteTipo}: ${params.fuenteNombre}`
      : params.fuenteTipo,
    category_id:      params.categoryId,
    fuente_longitud:  params.fuenteLongitud ?? "corta",
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarNotaIA(
  id: string,
  params: {
    title: string;
    contentProcesado: string;
    puntosClave: string[];
    categoryId: string | null;
  },
) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("kn_notes")
    .update({
      title:        params.title,
      content:      params.contentProcesado,
      puntos_clave: params.puntosClave,
      category_id:  params.categoryId,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// ── Sesión ────────────────────────────────────────────────────────────────────

export async function crearSesionNota(id: string, sesionId: string, contenido: string, orden: number) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  await supabase.schema("personal").from("knowledge_sesion_notas").insert({
    id,
    owner_id:  ownerId,
    sesion_id: sesionId,
    contenido,
    orden,
  });
}

export async function eliminarSesionNota(id: string) {
  const supabase = await createClient();
  await supabase.schema("personal").from("knowledge_sesion_notas").delete().eq("id", id);
}

export async function limpiarSesionNotas(sesionId: string) {
  const supabase = await createClient();
  await supabase.schema("personal").from("knowledge_sesion_notas").delete().eq("sesion_id", sesionId);
}

export async function eliminarNota(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_notes").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// ── Legacy (principios / sistemas — se mantienen para no romper) ──────────────

export async function crearNota(title: string, text: string, source: string, categoryId: string | null) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_notes").insert({
    owner_id: ownerId, title, content: text || null, source: source || null, category_id: categoryId,
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

export async function crearPrincipio(text: string, source: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("kn_principles").insert({ owner_id: ownerId, content: text, source: source || null });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarPrincipio(id: string, text: string, source: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_principles").update({ content: text, source: source || null }).eq("id", id);
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
  const { error } = await supabase.schema("personal").from("kn_systems").update({ title: name, content: desc || null }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarSistema(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("kn_systems").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
