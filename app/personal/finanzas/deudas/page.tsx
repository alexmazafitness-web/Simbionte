import { listDeudas } from "@/lib/personal/finanzas-queries";
import { DeudasPageClient } from "@/components/shared/finanzas/DeudasPageClient";

export default async function DeudasPage() {
  const deudas = await listDeudas();
  return <DeudasPageClient deudas={deudas} />;
}
