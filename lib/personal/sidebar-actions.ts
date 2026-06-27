"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/";

// ── Visibility ────────────────────────────────────────────────────────────────

export async function toggleSectionVisible(id: string, visible: boolean) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_sections").update({ visible }).eq("id", id);
  revalidatePath(PATH, "layout");
}

export async function toggleSubsectionVisible(id: string, visible: boolean) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_subsections").update({ visible }).eq("id", id);
  revalidatePath(PATH, "layout");
}

export async function toggleItemVisible(id: string, visible: boolean) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_items").update({ visible }).eq("id", id);
  revalidatePath(PATH, "layout");
}

// ── Rename ────────────────────────────────────────────────────────────────────

export async function renombrarSection(id: string, nombre: string) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_sections").update({ nombre }).eq("id", id);
  revalidatePath(PATH, "layout");
}

export async function renombrarSubsection(id: string, nombre: string) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_subsections").update({ nombre }).eq("id", id);
  revalidatePath(PATH, "layout");
}

export async function renombrarItem(id: string, nombre: string) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_items").update({ nombre }).eq("id", id);
  revalidatePath(PATH, "layout");
}

// ── Delete ────────────────────────────────────────────────────────────────────

export async function eliminarSection(id: string) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_sections").delete().eq("id", id).eq("es_core", false);
  revalidatePath(PATH, "layout");
}

export async function eliminarSubsection(id: string) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_subsections").delete().eq("id", id).eq("es_core", false);
  revalidatePath(PATH, "layout");
}

export async function eliminarItem(id: string) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await supabase.schema("personal").from("sidebar_items").delete().eq("id", id).eq("es_core", false);
  revalidatePath(PATH, "layout");
}

// ── Reorder ───────────────────────────────────────────────────────────────────

export async function reordenarSections(items: { id: string; orden: number }[]) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await Promise.all(
    items.map(({ id, orden }) =>
      supabase.schema("personal").from("sidebar_sections").update({ orden }).eq("id", id),
    ),
  );
  revalidatePath(PATH, "layout");
}

export async function reordenarSubsections(items: { id: string; orden: number }[]) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await Promise.all(
    items.map(({ id, orden }) =>
      supabase.schema("personal").from("sidebar_subsections").update({ orden }).eq("id", id),
    ),
  );
  revalidatePath(PATH, "layout");
}

export async function reordenarItems(items: { id: string; orden: number }[]) {
  const supabase = await createClient();
  await requireUserId(supabase);
  await Promise.all(
    items.map(({ id, orden }) =>
      supabase.schema("personal").from("sidebar_items").update({ orden }).eq("id", id),
    ),
  );
  revalidatePath(PATH, "layout");
}

// ── Add ───────────────────────────────────────────────────────────────────────

export async function addSection(nombre: string, icono: string | null) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { data: last } = await supabase
    .schema("personal").from("sidebar_sections").select("orden").order("orden", { ascending: false }).limit(1).single();
  const orden = (last?.orden ?? 0) + 1;
  const { data, error } = await supabase
    .schema("personal").from("sidebar_sections")
    .insert({ owner_id: ownerId, nombre, icono: icono || null, orden, es_core: false })
    .select("id").single();
  if (error) throw error;
  revalidatePath(PATH, "layout");
  return data.id as string;
}

export async function addSubsection(sectionId: string, nombre: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { data: last } = await supabase
    .schema("personal").from("sidebar_subsections")
    .select("orden").eq("section_id", sectionId).order("orden", { ascending: false }).limit(1).single();
  const orden = (last?.orden ?? 0) + 1;
  const { data, error } = await supabase
    .schema("personal").from("sidebar_subsections")
    .insert({ owner_id: ownerId, section_id: sectionId, nombre, orden, es_core: false })
    .select("id").single();
  if (error) throw error;
  revalidatePath(PATH, "layout");
  return data.id as string;
}

export async function addItem(
  sectionId: string,
  subsectionId: string | null,
  nombre: string,
  ruta: string,
  icono: string | null,
) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const query = supabase.schema("personal").from("sidebar_items").select("orden").eq("section_id", sectionId);
  if (subsectionId) query.eq("subsection_id", subsectionId);
  else query.is("subsection_id", null);
  const { data: last } = await query.order("orden", { ascending: false }).limit(1).single();
  const orden = (last?.orden ?? 0) + 1;

  const { data, error } = await supabase
    .schema("personal").from("sidebar_items")
    .insert({
      owner_id: ownerId,
      section_id: sectionId,
      subsection_id: subsectionId ?? null,
      nombre,
      ruta,
      icono: icono || null,
      orden,
      es_core: false,
    })
    .select("id").single();
  if (error) throw error;
  revalidatePath(PATH, "layout");
  return data.id as string;
}
