import { createClient } from "@/lib/supabase/server";
import type { FaseLlamadaId } from "./ventas-constants";
import type { LlamadaVM } from "./ventas";

type LlamadaRow = {
  id: string;
  lead_id: string | null;
  fecha: string;
  fase_alcanzada: FaseLlamadaId | null;
  resultado: string | null;
  notas: string | null;
  leads: { nombre: string } | null;
};

export async function listLlamadas(): Promise<LlamadaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("llamadas")
    .select("id, lead_id, fecha, fase_alcanzada, resultado, notas, leads ( nombre )")
    .order("fecha", { ascending: false });

  if (error) throw error;
  return (data as unknown as LlamadaRow[]).map((row) => ({
    id: row.id,
    leadId: row.lead_id,
    leadNombre: row.leads?.nombre ?? null,
    fecha: row.fecha,
    faseAlcanzada: row.fase_alcanzada,
    resultado: row.resultado,
    notas: row.notas,
  }));
}
