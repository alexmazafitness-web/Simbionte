import { createClient } from "@/lib/supabase/server";
import type { Recurrencia } from "./constants";

export type Tarifa = {
  id: string;
  precio: number;
  recurrencia: Recurrencia;
};

export async function listTarifas(): Promise<Tarifa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("tarifas")
    .select("id, precio, recurrencia")
    .order("precio");

  if (error) throw error;
  return data;
}
