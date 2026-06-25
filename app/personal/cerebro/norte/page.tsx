import { getGoal } from "@/lib/personal/goal-queries";
import { getPalanca } from "@/lib/personal/meta-queries";
import { NortePageClient } from "@/components/shared/cerebro/NortePageClient";

export default async function NortePage() {
  const [goal, palanca] = await Promise.all([getGoal(), getPalanca()]);
  return <NortePageClient goal={goal} palanca={palanca} />;
}
