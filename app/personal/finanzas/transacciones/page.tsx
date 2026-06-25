import { listTransacciones } from "@/lib/personal/finanzas-queries";
import { TransaccionesPageClient } from "@/components/shared/finanzas/TransaccionesPageClient";

export default async function TransaccionesPage() {
  const transacciones = await listTransacciones();
  return <TransaccionesPageClient transacciones={transacciones} />;
}
