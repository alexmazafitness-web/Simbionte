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

export type EventoUnicoInput = {
  title: string;
  startAt: string; // ISO
  endAt: string | null;
  type: Front;
  notes: string;
};

// Evento de fecha única — usa start_at/end_at en vez de start_min/end_min+recur.
// Es el mecanismo que reutiliza el puente Leads → Calendario.
export async function crearEventoUnico(input: EventoUnicoInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("events").insert({
    owner_id: ownerId,
    title: input.title,
    start_at: input.startAt,
    end_at: input.endAt,
    event_type: input.type,
    description: input.notes || null,
  });
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

export async function editarEventoUnico(id: string, input: EventoUnicoInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("events")
    .update({
      title: input.title,
      start_at: input.startAt,
      end_at: input.endAt,
      event_type: input.type,
      description: input.notes || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

export async function eliminarEventoUnico(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("events").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

// ── Mover bloque recurrente ───────────────────────────────────────────────────

// "Solo hoy": crea un evento único en el nuevo horario Y suprime el recurrente
// para ese día concreto añadiendo iso a exceptDates en su recur rule.
export async function moverBloqueHoy(
  bloqueId: string,
  isoDate: string,
  newStartMin: number,
  newEndMin: number,
) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  // Fetch the original block for its metadata
  const { data: bloque, error: fetchErr } = await supabase
    .schema("personal").from("events")
    .select("title, event_type, description, recur")
    .eq("id", bloqueId)
    .single();
  if (fetchErr || !bloque) throw fetchErr ?? new Error("Bloque no encontrado");

  const recur = bloque.recur as RecurRule;
  const exceptDates = [...(recur.exceptDates ?? []), isoDate];

  const [y, mo, d] = isoDate.split("-").map(Number);
  const startAt = new Date(y!, mo! - 1, d!, Math.floor(newStartMin / 60), newStartMin % 60, 0).toISOString();
  const endAt   = new Date(y!, mo! - 1, d!, Math.floor(newEndMin   / 60), newEndMin   % 60, 0).toISOString();

  await Promise.all([
    // Suppress recurring block on this day
    supabase.schema("personal").from("events").update({ recur: { ...recur, exceptDates } }).eq("id", bloqueId),
    // Create one-off event at the new time
    supabase.schema("personal").from("events").insert({
      owner_id:   ownerId,
      title:      bloque.title,
      start_at:   startAt,
      end_at:     endAt,
      event_type: bloque.event_type,
      description: bloque.description,
    }),
  ]);

  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}

// "Todos": actualiza start_min/end_min del bloque recurrente.
export async function moverBloqueTodos(bloqueId: string, newStartMin: number, newEndMin: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal").from("events")
    .update({ start_min: newStartMin, end_min: newEndMin })
    .eq("id", bloqueId);
  if (error) throw error;
  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}
