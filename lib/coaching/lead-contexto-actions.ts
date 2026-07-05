"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { DatosManualesLead } from "./lead-contexto";

const PATH = "/coaching/leads";

// Un único guardado: los datos de entrada (cuestionario o manuales) y el
// script recién generado se persisten juntos, en el mismo click de
// "Generar script" — no hay un paso previo de "guardar borrador".
export async function guardarContextoYScript(
  leadId: string,
  input: {
    respuestasCuestionario: string;
    datosManuales: DatosManualesLead | null;
    scriptGenerado: string;
  },
) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("coaching").from("lead_contexto").upsert(
    {
      owner_id:               ownerId,
      lead_id:                leadId,
      respuestas_cuestionario: input.respuestasCuestionario || null,
      datos_manuales:          input.datosManuales,
      script_generado:         input.scriptGenerado,
      script_generado_at:      new Date().toISOString(),
    },
    { onConflict: "lead_id" },
  );
  if (error) throw error;
  revalidatePath(PATH);
}
