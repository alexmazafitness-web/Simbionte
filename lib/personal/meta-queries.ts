import { createClient } from "@/lib/supabase/server";

export async function getPalanca(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("personal").from("meta").select("value").eq("key", "palanca").maybeSingle();
  if (error) throw error;
  return typeof data?.value === "string" ? data.value : "";
}

export async function getVistaCalendario(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.schema("personal").from("meta").select("value").eq("key", "cal_vista").maybeSingle();
  const v = typeof data?.value === "string" ? data.value : "dia";
  return ["dia", "semana", "mes", "año"].includes(v) ? v : "dia";
}
