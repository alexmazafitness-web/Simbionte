"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { ETAPA_SIGUIENTE, type Etapa } from "./constants";

const PATH = "/coaching/leads";

export type LeadInput = {
  nombre: string;
  contacto: string;
  origen: string;
  nota: string;
};

export async function crearLead(input: LeadInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("leads").insert({
    owner_id: ownerId,
    nombre: input.nombre,
    telefono: input.contacto || null,
    origen: input.origen || null,
    nota: input.nota || null,
    estado: "nuevo",
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarLead(id: string, input: LeadInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("leads")
    .update({
      nombre: input.nombre,
      telefono: input.contacto || null,
      origen: input.origen || null,
      nota: input.nota || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function avanzarLead(id: string, etapaActual: Etapa) {
  const siguiente = ETAPA_SIGUIENTE[etapaActual as keyof typeof ETAPA_SIGUIENTE];
  if (!siguiente) return;
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("leads").update({ estado: siguiente }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function descartarLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("leads").update({ estado: "descartado" }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarLead(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("leads").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
