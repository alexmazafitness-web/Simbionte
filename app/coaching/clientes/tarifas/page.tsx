import { listTarifas } from "@/lib/coaching/tarifas";
import { TarifasPageClient } from "@/components/shared/clientes/TarifasPageClient";

export default async function TarifasPage() {
  const tarifas = await listTarifas();
  return <TarifasPageClient tarifas={tarifas} />;
}
