"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { Front } from "./constants";
import type { RecurRule } from "./recurrence";

const PATH = "/personal/cerebro/calendario";

export type BloqueInput = {
  title: string;
  startMin: number;
  endMin: number;
  type: Front;
  notes: string;
  recur: RecurRule;
};

export async function crearBloque(input: BloqueInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("events").insert({
    owner_id: ownerId,
    title: input.title,
    start_min: input.startMin,
    end_min: input.endMin,
    event_type: input.type,
    description: input.notes || null,
    recur: input.recur,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarBloque(id: string, input: BloqueInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("events")
    .update({
      title: input.title,
      start_min: input.startMin,
      end_min: input.endMin,
      event_type: input.type,
      description: input.notes || null,
      recur: input.recur,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarBloque(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function marcarFecha(date: string, note: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("personal")
    .from("marked_dates")
    .upsert({ owner_id: ownerId, date, label: note || null }, { onConflict: "owner_id,date" });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function desmarcarFecha(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("marked_dates").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
