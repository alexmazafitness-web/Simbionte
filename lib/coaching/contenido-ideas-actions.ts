"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { ContenidoFuente, ContenidoFormato, ContenidoEstado } from "./contenido-ideas";

const PATH = "/coaching/contenido";

// ── Captura ───────────────────────────────────────────────────────────────────

export async function capturarIdeaRapida(titulo: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("contenido_ideas").insert({
    owner_id: ownerId,
    titulo,
    estado: "idea",
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export type IdeaCompletaInput = {
  titulo: string;
  descripcion: string;
  fuente: ContenidoFuente | "";
  formato: ContenidoFormato | "";
  notas: string;
};

export async function crearIdeaCompleta(input: IdeaCompletaInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("contenido_ideas").insert({
    owner_id:    ownerId,
    titulo:      input.titulo,
    descripcion: input.descripcion || null,
    fuente:      input.fuente || null,
    formato:     input.formato || null,
    notas:       input.notas || null,
    estado:      "idea",
  });
  if (error) throw error;
  revalidatePath(PATH);
}

// Alta en bloque de las ideas propuestas por /api/contenido/generar-ideas —
// todas entran como 'idea' al banco, igual que una captura manual.
export async function crearIdeasGeneradas(
  ideas: { titulo: string; descripcion: string; fuente: ContenidoFuente; formato: ContenidoFormato }[],
) {
  if (ideas.length === 0) return;
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("contenido_ideas").insert(
    ideas.map((i) => ({
      owner_id:    ownerId,
      titulo:      i.titulo,
      descripcion: i.descripcion || null,
      fuente:      i.fuente || null,
      formato:     i.formato || null,
      estado:      "idea",
    })),
  );
  if (error) throw error;
  revalidatePath(PATH);
}

// ── Edición ───────────────────────────────────────────────────────────────────

export type IdeaEditInput = {
  titulo: string;
  descripcion: string;
  fuente: ContenidoFuente | "";
  formato: ContenidoFormato | "";
  semanaAsignada: string;   // "" → null
  fechaPublicacion: string; // "" → null — día objetivo o, si ya publicado, fecha real
  urlPublicado: string;
  notas: string;
};

export async function editarIdeaContenido(id: string, input: IdeaEditInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("contenido_ideas")
    .update({
      titulo:            input.titulo,
      descripcion:       input.descripcion || null,
      fuente:            input.fuente || null,
      formato:           input.formato || null,
      semana_asignada:   input.semanaAsignada || null,
      fecha_publicacion: input.fechaPublicacion || null,
      url_publicado:     input.urlPublicado || null,
      notas:             input.notas || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// ── Flujo del banco → calendario ─────────────────────────────────────────────

export async function seleccionarParaSemana(id: string, semanaAsignada: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("contenido_ideas")
    .update({ estado: "seleccionada", semana_asignada: semanaAsignada })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

// nuevoEstado/fecha los decide el cliente (necesita "hoy" en la zona horaria
// real del usuario — nunca calculado en el servidor, ver CLAUDE.md hora local).
export async function avanzarEstado(
  id: string,
  nuevoEstado: ContenidoEstado,
  extra?: { urlPublicado?: string; fechaPublicacion?: string },
) {
  const supabase = await createClient();
  const update: Record<string, unknown> = { estado: nuevoEstado };
  if (nuevoEstado === "publicado") {
    update.url_publicado = extra?.urlPublicado || null;
    if (extra?.fechaPublicacion) update.fecha_publicacion = extra.fechaPublicacion;
  }
  const { error } = await supabase.schema("coaching").from("contenido_ideas").update(update).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function descartarIdea(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("contenido_ideas").update({ estado: "descartado" }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarIdeaContenido(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("contenido_ideas").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
