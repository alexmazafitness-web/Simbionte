import { createClient } from "@/lib/supabase/server";
import type { ChecklistEstadoVM } from "./contenido";

export async function listChecklist(): Promise<ChecklistEstadoVM> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("coaching").from("contenido_checklist").select("key, checked");
  if (error) throw error;
  return Object.fromEntries(data.map((row) => [row.key, row.checked]));
}
