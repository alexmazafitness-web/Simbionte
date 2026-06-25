"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { EstadoPieza, TipoPieza } from "./contenido-constants";

const PATH = "/coaching/contenido";

export type PiezaInput = {
  titulo: string;
  tipo: TipoPieza;
  estado: EstadoPieza;
  fechaPublicacion: string;
  url: string;
};

export async function crearPieza(input: PiezaInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("contenido_ig").insert({
    owner_id: ownerId,
    titulo: input.titulo,
    tipo: input.tipo,
    estado: input.estado,
    fecha_publicacion: input.fechaPublicacion || null,
    url: input.url || null,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarPieza(id: string, input: PiezaInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("contenido_ig")
    .update({
      titulo: input.titulo,
      tipo: input.tipo,
      estado: input.estado,
      fecha_publicacion: input.fechaPublicacion || null,
      url: input.url || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarPieza(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("contenido_ig").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function toggleChecklistItem(key: string, checked: boolean) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("coaching")
    .from("contenido_checklist")
    .upsert({ owner_id: ownerId, key, checked }, { onConflict: "owner_id,key" });
  if (error) throw error;
  revalidatePath(PATH);
}
