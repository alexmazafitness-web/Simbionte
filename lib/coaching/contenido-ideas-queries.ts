import { createClient } from "@/lib/supabase/server";
import type { ContenidoIdeaVM, ContenidoFuente, ContenidoFormato, ContenidoEstado } from "./contenido-ideas";

export async function listContenidoIdeas(): Promise<ContenidoIdeaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("contenido_ideas")
    .select("id, titulo, descripcion, fuente, formato, estado, semana_asignada, fecha_publicacion, url_publicado, notas, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id:               row.id,
    titulo:           row.titulo,
    descripcion:      row.descripcion,
    fuente:           row.fuente as ContenidoFuente | null,
    formato:          row.formato as ContenidoFormato | null,
    estado:           row.estado as ContenidoEstado,
    semanaAsignada:   row.semana_asignada,
    fechaPublicacion: row.fecha_publicacion,
    urlPublicado:     row.url_publicado,
    notas:            row.notas,
    createdAt:        row.created_at,
  }));
}
