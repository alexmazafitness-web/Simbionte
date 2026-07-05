import { createClient } from "@/lib/supabase/server";
import type { LeadContextoVM, DatosManualesLead } from "./lead-contexto";

// Todos los contextos de golpe (evita N+1 al abrir el kanban de leads),
// indexados por lead_id.
export async function listLeadContextos(): Promise<Record<string, LeadContextoVM>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("lead_contexto")
    .select("id, lead_id, respuestas_cuestionario, datos_manuales, script_generado, script_generado_at");
  if (error) throw error;

  const map: Record<string, LeadContextoVM> = {};
  for (const row of data) {
    map[row.lead_id] = {
      id:                     row.id,
      leadId:                 row.lead_id,
      respuestasCuestionario: row.respuestas_cuestionario,
      datosManuales:          row.datos_manuales as DatosManualesLead | null,
      scriptGenerado:         row.script_generado,
      scriptGeneradoAt:       row.script_generado_at,
    };
  }
  return map;
}
