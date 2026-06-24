import { createClient } from "@/lib/supabase/server";

export type GrupoRevision = {
  id: string;
  codigo: string;
  nombre: string;
};

export async function listGruposRevision(): Promise<GrupoRevision[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("grupos_revision")
    .select("id, codigo, nombre")
    .order("codigo");

  if (error) throw error;
  return data;
}
