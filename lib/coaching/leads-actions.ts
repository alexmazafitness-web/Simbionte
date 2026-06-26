"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
// Puente Leads → Calendario (docs/arquitectura-simbionte.md §6): se llama
// directamente a la acción de Eventos de Personal, sin tabla intermedia ni FK.
import { crearEventoUnico } from "@/lib/personal/events-actions";
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

// Avanza el lead a "llamada_agendada" Y crea el evento de calendario para
// esa llamada en un único paso — si el usuario cancela el modal de fecha en
// la UI, esta función nunca se llama y el lead se queda donde estaba.
//
// Sin transacción real entre los dos esquemas: el evento se crea ANTES de
// avanzar la etapa a propósito. Si algo falla a mitad de camino, el peor
// caso es un evento huérfano (el dato de la llamada no se pierde) en vez de
// un lead marcado "llamada_agendada" sin ningún evento que lo respalde.
export async function agendarLlamada(leadId: string, nombreLead: string, contacto: string, fechaISO: string, hora: string) {
  const startAt = new Date(`${fechaISO}T${hora}`);
  const endAt = new Date(startAt.getTime() + 30 * 60_000);

  await crearEventoUnico({
    title: `Llamada · ${nombreLead}`,
    startAt: startAt.toISOString(),
    endAt: endAt.toISOString(),
    type: "coaching",
    notes: contacto ? `Contacto: ${contacto}` : "",
  });

  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("leads").update({ estado: "llamada_agendada" }).eq("id", leadId);
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
