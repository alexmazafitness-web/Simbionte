import { listObjetivosAhorro } from "@/lib/personal/finanzas-queries";
import { AhorroPageClient } from "@/components/shared/finanzas/AhorroPageClient";

export default async function AhorroPage() {
  const objetivos = await listObjetivosAhorro();
  return <AhorroPageClient objetivos={objetivos} />;
}
