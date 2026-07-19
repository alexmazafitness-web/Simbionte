import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { DESEOS_CATS_DEFAULT } from "./constants";
import type { DeseoCategoriaVM, DeseoVM, DeseoPrioridad, DeseoEstado } from "./deseos";

export async function listDeseosCategorias(): Promise<DeseoCategoriaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("deseos_categorias")
    .select("id, emoji, nombre")
    .order("nombre");
  if (error) throw error;

  if (data.length > 0) return data;

  const ownerId = await requireUserId(supabase);
  const { data: seeded, error: seedError } = await supabase
    .schema("personal")
    .from("deseos_categorias")
    .insert(DESEOS_CATS_DEFAULT.map((c) => ({ owner_id: ownerId, emoji: c.emoji, nombre: c.name })))
    .select("id, emoji, nombre");
  if (seedError) throw seedError;

  return seeded;
}

export async function listDeseos(): Promise<DeseoVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("lista_deseos")
    .select("id, nombre, categoria_id, precio, precio_final, link, prioridad, estado, notas, imagen_url, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id:          row.id,
    nombre:      row.nombre,
    categoriaId: row.categoria_id,
    precio:      row.precio !== null ? Number(row.precio) : null,
    precioFinal: row.precio_final !== null ? Number(row.precio_final) : null,
    link:        row.link,
    prioridad:   row.prioridad as DeseoPrioridad,
    estado:      row.estado as DeseoEstado,
    notas:       row.notas,
    imagenUrl:   row.imagen_url,
    createdAt:   row.created_at,
  }));
}
