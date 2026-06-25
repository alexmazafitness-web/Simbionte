import { createClient } from "@/lib/supabase/server";
import type { EstadoTarjeta, FaseId, TipoTarjeta } from "./negocio-constants";
import type { TarjetaVM } from "./negocio";

type TarjetaRow = {
  id: string;
  fase_id: FaseId;
  tipo: TipoTarjeta | null;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarjeta;
  roadmap_subtasks: { id: string; texto: string; hecha: boolean; orden: number }[];
};

export async function listTarjetas(): Promise<TarjetaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("roadmap_items")
    .select("id, fase_id, tipo, titulo, descripcion, estado, roadmap_subtasks ( id, texto, hecha, orden )")
    .order("created_at");

  if (error) throw error;
  return (data as unknown as TarjetaRow[]).map((row) => ({
    id: row.id,
    faseId: row.fase_id,
    tipo: row.tipo,
    titulo: row.titulo,
    nota: row.descripcion,
    estado: row.estado,
    subtareas: [...row.roadmap_subtasks].sort((a, b) => a.orden - b.orden).map((s) => ({ id: s.id, texto: s.texto, hecha: s.hecha })),
  }));
}
