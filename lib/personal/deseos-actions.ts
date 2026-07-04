"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { DeseoPrioridad, DeseoEstado } from "./deseos";

const PATH = "/personal/deseos";

// ── Categorías ────────────────────────────────────────────────────────────────

export async function crearDeseoCategoria(emoji: string, nombre: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("deseos_categorias").insert({ owner_id: ownerId, emoji, nombre });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function renombrarDeseoCategoria(id: string, emoji: string, nombre: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("deseos_categorias").update({ emoji, nombre }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarDeseoCategoria(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("deseos_categorias").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// ── Deseos ────────────────────────────────────────────────────────────────────

export type DeseoInput = {
  nombre: string;
  categoriaId: string | null;
  precio: string;   // string desde el form; "" = sin precio
  link: string;
  prioridad: DeseoPrioridad;
  notas: string;
  imagenUrl: string;
};

function toPrecio(precio: string): number | null {
  if (!precio.trim()) return null;
  const n = Number(precio.replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

export async function crearDeseo(input: DeseoInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("lista_deseos").insert({
    owner_id:     ownerId,
    nombre:       input.nombre,
    categoria_id: input.categoriaId,
    precio:       toPrecio(input.precio),
    link:         input.link || null,
    prioridad:    input.prioridad,
    notas:        input.notas || null,
    imagen_url:   input.imagenUrl || null,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarDeseo(id: string, input: DeseoInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("lista_deseos")
    .update({
      nombre:       input.nombre,
      categoria_id: input.categoriaId,
      precio:       toPrecio(input.precio),
      link:         input.link || null,
      prioridad:    input.prioridad,
      notas:        input.notas || null,
      imagen_url:   input.imagenUrl || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function cambiarEstadoDeseo(id: string, estado: DeseoEstado) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("lista_deseos").update({ estado }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarDeseo(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("lista_deseos").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
