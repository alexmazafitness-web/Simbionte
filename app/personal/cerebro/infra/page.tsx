import { listInfra } from "@/lib/personal/infra-queries";
import { InfraPageClient } from "@/components/shared/cerebro/InfraPageClient";

export default async function InfraPage() {
  const items = await listInfra();
  return <InfraPageClient items={items} />;
}
