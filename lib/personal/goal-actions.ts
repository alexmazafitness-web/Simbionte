"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/personal/cerebro/norte";

export async function actualizarNorte(current: number, target: number, pricePerClient: number) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const { data: existente, error: fetchError } = await supabase
    .schema("personal")
    .from("goal")
    .select("id, current_value")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (fetchError) throw fetchError;

  let goalId: string;

  if (!existente) {
    const { data: nuevo, error: insertError } = await supabase
      .schema("personal")
      .from("goal")
      .insert({ owner_id: ownerId, title: "Norte", current_value: current, target_value: target, price_per_client: pricePerClient })
      .select("id")
      .single();
    if (insertError) throw insertError;
    goalId = nuevo.id;
  } else {
    goalId = existente.id;
    const { error: updateError } = await supabase
      .schema("personal")
      .from("goal")
      .update({ current_value: current, target_value: target, price_per_client: pricePerClient })
      .eq("id", goalId);
    if (updateError) throw updateError;
  }

  // Solo se registra un punto en el histórico si el valor actual cambió
  // (igual que el HTML: `if(cur!==S.goal.cur)S.goal.hist.push(...)`).
  if (!existente || existente.current_value !== current) {
    const { error: historyError } = await supabase
      .schema("personal")
      .from("goal_history")
      .insert({ owner_id: ownerId, goal_id: goalId, value: current });
    if (historyError) throw historyError;
  }

  revalidatePath(PATH);
  revalidatePath("/personal/cerebro");
}
