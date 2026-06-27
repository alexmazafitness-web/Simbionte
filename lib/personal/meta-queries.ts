import { createClient } from "@/lib/supabase/server";
export async function getPalanca(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("personal").from("meta").select("value").eq("key", "palanca").maybeSingle();
  if (error) throw error;
  return typeof data?.value === "string" ? data.value : "";
}
