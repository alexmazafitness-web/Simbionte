"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { FaseLlamadaId } from "./ventas-constants";

const PATH = "/coaching/ventas";

export type LlamadaInput = {
  leadId: string;
  fecha: string;
  faseAlcanzada: FaseLlamadaId | null;
  resultado: string;
  notas: string;
};

export async function crearLlamada(input: LlamadaInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("llamadas").insert({
    owner_id: ownerId,
    lead_id: input.leadId,
    fecha: input.fecha,
    fase_alcanzada: input.faseAlcanzada,
    resultado: input.resultado || null,
    notas: input.notas || null,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarLlamada(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("llamadas").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
