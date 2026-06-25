"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { Front } from "./constants";

const PATH = "/personal/cerebro/recordatorios";

export async function crearRecordatorio(text: string, whenISO: string, front: Front) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("reminders").insert({
    owner_id: ownerId,
    title: text,
    remind_at: whenISO,
    front,
    done: false,
  });
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

export async function editarRecordatorio(id: string, text: string, whenISO: string, front: Front) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("reminders")
    .update({ title: text, remind_at: whenISO, front })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

export async function marcarRecordatorioHecho(id: string, done: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("reminders").update({ done }).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

export async function eliminarRecordatorio(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("reminders").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}
