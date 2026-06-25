import { listCrypto, listDeudas, listInversiones, listObjetivosAhorro, listTransacciones } from "@/lib/personal/finanzas-queries";
import { ResumenPageClient } from "@/components/shared/finanzas/ResumenPageClient";

export default async function FinanzasPage() {
  const [transacciones, inversiones, crypto, deudas, objetivos] = await Promise.all([
    listTransacciones(),
    listInversiones(),
    listCrypto(),
    listDeudas(),
    listObjetivosAhorro(),
  ]);

  return <ResumenPageClient transacciones={transacciones} inversiones={inversiones} crypto={crypto} deudas={deudas} objetivos={objetivos} />;
}
