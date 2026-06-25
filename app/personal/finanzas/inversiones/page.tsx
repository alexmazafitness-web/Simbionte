import { listInversiones } from "@/lib/personal/finanzas-queries";
import { InversionesPageClient } from "@/components/shared/finanzas/InversionesPageClient";

export default async function InversionesPage() {
  const inversiones = await listInversiones();
  return <InversionesPageClient inversiones={inversiones} />;
}
