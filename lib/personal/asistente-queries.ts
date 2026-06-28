import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { HORARIO_DEFAULT, type HorarioConfig } from "./asistente-types";

export async function getHorarioConfig(): Promise<HorarioConfig> {
  const supabase = await createClient();
  await requireUserId(supabase);
  const { data } = await supabase
    .schema("personal")
    .from("meta")
    .select("value")
    .eq("key", "asistente_horario")
    .maybeSingle();
  if (!data?.value) return HORARIO_DEFAULT;
  return data.value as HorarioConfig;
}
