import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Recurrencia } from "./constants";

export type Tarifa = {
  id: string;
  precio: number;
  recurrencia: Recurrencia;
};

// cache() deduplica llamadas dentro del mismo render — si varios Server
// Components piden las tarifas en la misma petición, solo va una query.
export const listTarifas = cache(async (): Promise<Tarifa[]> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("tarifas")
    .select("id, precio, recurrencia")
    .order("precio");

  if (error) throw error;
  return data;
});
