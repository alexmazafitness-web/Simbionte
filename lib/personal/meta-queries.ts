import { createClient } from "@/lib/supabase/server";
import { REVISION_VACIA, type RevisionVM } from "./meta";

export async function getRevision(): Promise<RevisionVM> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("meta")
    .select("value")
    .eq("key", "review")
    .maybeSingle();
  if (error) throw error;
  return data?.value ? { ...REVISION_VACIA, ...(data.value as Partial<RevisionVM>) } : REVISION_VACIA;
}

export async function getPalanca(): Promise<string> {
  const supabase = await createClient();
  const { data, error } = await supabase.schema("personal").from("meta").select("value").eq("key", "palanca").maybeSingle();
  if (error) throw error;
  return typeof data?.value === "string" ? data.value : "";
}
