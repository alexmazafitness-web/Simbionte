import { createClient } from "@/lib/supabase/server";
import type { CredencialVM, CredencialCategoria } from "./credenciales";

// Nunca selecciona valor_cifrado: la lista solo necesita metadatos. El valor
// real solo se pide bajo demanda vía /api/credenciales/reveal.
export async function listCredenciales(): Promise<CredencialVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("credenciales")
    .select("id, nombre, categoria, servicio, descripcion, url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id:          row.id,
    nombre:      row.nombre,
    categoria:   row.categoria as CredencialCategoria,
    servicio:    row.servicio,
    descripcion: row.descripcion,
    url:         row.url,
    createdAt:   row.created_at,
  }));
}
