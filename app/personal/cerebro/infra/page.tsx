import { listInfra } from "@/lib/personal/infra-queries";
import { listCredenciales } from "@/lib/personal/credenciales-queries";
import { InfraPageClient } from "@/components/shared/cerebro/InfraPageClient";

export default async function InfraPage() {
  const [items, credenciales] = await Promise.all([listInfra(), listCredenciales()]);
  return <InfraPageClient items={items} credenciales={credenciales} />;
}
