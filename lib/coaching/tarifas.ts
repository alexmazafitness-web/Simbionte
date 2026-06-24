import { createClient } from "@/lib/supabase/server";

export type Tarifa = {
  id: string;
  precio: number;
};

export async function listTarifas(): Promise<Tarifa[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("coaching")
    .from("tarifas")
    .select("id, precio")
    .order("precio");

  if (error) throw error;
  return data;
}
