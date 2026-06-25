import { createClient } from "@/lib/supabase/server";
import type { EstadoPieza, TipoPieza } from "./contenido-constants";
import type { ChecklistEstadoVM, PiezaVM } from "./contenido";

type PiezaRow = {
  id: string;
  titulo: string;
  tipo: TipoPieza | null;
  estado: EstadoPieza;
  fecha_publicacion: string | null;
  url: string | null;
};

export async function listPiezas(): Promise<PiezaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("contenido_ig")
    .select("id, titulo, tipo, estado, fecha_publicacion, url")
    .order("fecha_publicacion", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data as PiezaRow[]).map((row) => ({
    id: row.id,
    titulo: row.titulo,
    tipo: row.tipo,
    estado: row.estado,
    fechaPublicacion: row.fecha_publicacion,
    url: row.url,
  }));
}

export async function listChecklist(): Promise<ChecklistEstadoVM> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("coaching").from("contenido_checklist").select("key, checked");
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.key, row.checked]));
}
