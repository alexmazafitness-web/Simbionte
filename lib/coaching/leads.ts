import { createClient } from "@/lib/supabase/server";
import type { Etapa } from "./constants";

export type Lead = {
  id: string;
  nombre: string;
  contacto: string | null;
  origen: string | null;
  nota: string | null;
  etapa: Etapa;
};

export async function listLeads(): Promise<Lead[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("leads")
    .select("id, nombre, telefono, origen, nota, estado")
    .order("created_at");

  if (error) throw error;
  return data.map((l) => ({
    id: l.id,
    nombre: l.nombre,
    contacto: l.telefono,
    origen: l.origen,
    nota: l.nota,
    etapa: l.estado as Etapa,
  }));
}
