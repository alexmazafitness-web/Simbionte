import { createClient } from "@/lib/supabase/server";
import type { GoalVM } from "./goal";

export async function getGoal(): Promise<GoalVM> {
  const supabase = await createClient();

  const { data: goalRow, error: goalError } = await supabase
    .schema("personal")
    .from("goal")
    .select("id, current_value, target_value, price_per_client")
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (goalError) throw goalError;

  if (!goalRow) {
    return { id: null, current: 0, target: 0, pricePerClient: 0, history: [] };
  }

  const { data: historyRows, error: historyError } = await supabase
    .schema("personal")
    .from("goal_history")
    .select("value, recorded_at")
    .eq("goal_id", goalRow.id)
    .order("recorded_at");
  if (historyError) throw historyError;

  return {
    id: goalRow.id,
    current: goalRow.current_value,
    target: goalRow.target_value,
    pricePerClient: goalRow.price_per_client,
    history: (historyRows ?? []).map((h) => ({ value: h.value, recordedAt: h.recorded_at })),
  };
}
