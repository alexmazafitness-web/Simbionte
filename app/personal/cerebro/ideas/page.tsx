import { listIdeas } from "@/lib/personal/ideas-queries";
import { IdeasPageClient } from "@/components/shared/cerebro/IdeasPageClient";

export default async function IdeasPage() {
  const ideas = await listIdeas();
  return <IdeasPageClient ideas={ideas} />;
}
