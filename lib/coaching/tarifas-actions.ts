"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/coaching/clientes/tarifas";

export async function crearTarifa(precio: number) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("coaching")
    .from("tarifas")
    .insert({ owner_id: ownerId, nombre: `${precio} €`, precio });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarTarifa(id: string, precio: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("coaching")
    .from("tarifas")
    .update({ nombre: `${precio} €`, precio })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarTarifa(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("coaching").from("tarifas").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
