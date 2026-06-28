"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { HorarioConfig, BloquePlanActivo } from "./asistente-types";
import type { Front } from "./constants";

function frenteToFront(frente: string): Front {
  const map: Record<string, Front> = {
    Servicio:  "coaching",
    Contenido: "contenido",
    Estudio:   "formacion",
    Personal:  "personal",
  };
  return (map[frente] as Front) ?? "personal";
}

export async function guardarHorarioConfig(config: HorarioConfig) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("personal")
    .from("meta")
    .upsert(
      { owner_id: ownerId, key: "asistente_horario", value: config as unknown as Record<string, unknown> },
      { onConflict: "owner_id,key" },
    );
  if (error) throw error;
}

export async function aceptarPlan(bloques: BloquePlanActivo[], hoyISO: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const rows = bloques.map((b) => ({
    owner_id:   ownerId,
    title:      b.titulo,
    start_at:   `${hoyISO}T${b.hora_inicio}:00`,
    end_at:     `${hoyISO}T${b.hora_fin}:00`,
    event_type: frenteToFront(b.frente),
    description: b.pasos.length > 0 ? b.pasos.map((p) => `• ${p}`).join("\n") : null,
  }));

  const { error } = await supabase.schema("personal").from("events").insert(rows);
  if (error) throw error;
  revalidatePath("/personal/cerebro");
}
