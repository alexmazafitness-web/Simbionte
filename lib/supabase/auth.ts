import type { SupabaseClient } from "@supabase/supabase-js";

export async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("No hay sesión activa.");
  return data.user.id;
}
