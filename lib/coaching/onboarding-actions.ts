"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { addDaysISO } from "./format";
import { ONBOARDING_PASOS, FASE_REMINDER_LABEL, type OnboardingFase } from "./onboarding-constants";

const PATH = "/coaching/onboarding";

export async function initOnboarding(
  clienteId: string,
  clienteNombre: string,
  fechaAlta: string,
) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const { data: onb, error: onbError } = await supabase
    .schema("coaching")
    .from("onboarding")
    .insert({ owner_id: ownerId, cliente_id: clienteId, fecha_inicio: fechaAlta })
    .select("id")
    .single();
  if (onbError) throw onbError;

  const { error: pasosError } = await supabase
    .schema("coaching")
    .from("onboarding_pasos")
    .insert(
      ONBOARDING_PASOS.map((p) => ({
        owner_id:      ownerId,
        onboarding_id: onb.id,
        fase:          p.fase,
        dia_offset:    p.dia_offset,
        titulo:        p.titulo,
        orden:         p.orden,
      })),
    );
  if (pasosError) throw pasosError;

  // Create reminders for D3, S1, MES1 only (D0 = today, no reminder needed)
  const reminderFases = new Set<string>();
  const reminders = [];
  for (const p of ONBOARDING_PASOS) {
    if (p.dia_offset > 0 && !reminderFases.has(p.fase)) {
      reminderFases.add(p.fase);
      const label = FASE_REMINDER_LABEL[p.fase];
      if (label) {
        reminders.push({
          owner_id:  ownerId,
          title:     `Onboarding ${clienteNombre}: ${label}`,
          remind_at: new Date(addDaysISO(fechaAlta, p.dia_offset) + "T09:00:00").toISOString(),
          done:      false,
          front:     "coaching",
        });
      }
    }
  }

  if (reminders.length > 0) {
    const { error: remError } = await supabase
      .schema("personal")
      .from("reminders")
      .insert(reminders);
    if (remError) throw remError;
  }

  revalidatePath(PATH);
}

export async function actualizarMensajeOnboarding(etapa: OnboardingFase, contenido: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const { error } = await supabase
    .schema("coaching")
    .from("onboarding_mensajes")
    .update({ contenido })
    .eq("owner_id", ownerId)
    .eq("etapa", etapa);
  if (error) throw error;

  revalidatePath(PATH);
}

export async function marcarPaso(
  pasoId: string,
  onboardingId: string,
  completado: boolean,
) {
  const supabase = await createClient();

  const { error: pasoError } = await supabase
    .schema("coaching")
    .from("onboarding_pasos")
    .update({
      completado,
      completado_at: completado ? new Date().toISOString() : null,
    })
    .eq("id", pasoId);
  if (pasoError) throw pasoError;

  if (completado) {
    // If all steps done → mark onboarding complete
    const { data: pasos, error: checkError } = await supabase
      .schema("coaching")
      .from("onboarding_pasos")
      .select("completado")
      .eq("onboarding_id", onboardingId);
    if (checkError) throw checkError;

    if (pasos.every((p) => p.completado)) {
      const { error } = await supabase
        .schema("coaching")
        .from("onboarding")
        .update({ estado: "completado", completado_at: new Date().toISOString() })
        .eq("id", onboardingId);
      if (error) throw error;
    }
  } else {
    // Unchecking a step re-opens a completed onboarding
    await supabase
      .schema("coaching")
      .from("onboarding")
      .update({ estado: "en_progreso", completado_at: null })
      .eq("id", onboardingId)
      .eq("estado", "completado");
  }

  revalidatePath(PATH);
}
