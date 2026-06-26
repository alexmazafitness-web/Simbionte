import { cache } from "react";
import { createClient } from "@/lib/supabase/server";

export type GrupoRevision = {
  id: string;
  codigo: string;
  nombre: string;
};

// cache() deduplica llamadas dentro del mismo render — si varios Server
// Components piden los grupos en la misma petición, solo va una query.
export const listGruposRevision = cache(async (): Promise<GrupoRevision[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("grupos_revision")
    .select("id, codigo, nombre")
    .order("codigo");

  if (error) throw error;
  return data;
});
