import { listCrypto, listDeudas, listInversiones, listObjetivosAhorro, listTransacciones } from "@/lib/personal/finanzas-queries";
import { obtenerMRRActual } from "@/lib/coaching/clientes-queries";
import { ResumenPageClient } from "@/components/shared/finanzas/ResumenPageClient";

export default async function FinanzasPage() {
  const [transacciones, inversiones, crypto, deudas, objetivos, mrrCoaching] = await Promise.all([
    listTransacciones(),
    listInversiones(),
    listCrypto(),
    listDeudas(),
    listObjetivosAhorro(),
    obtenerMRRActual(),
  ]);

  return (
    <ResumenPageClient
      transacciones={transacciones}
      inversiones={inversiones}
      crypto={crypto}
      deudas={deudas}
      objetivos={objetivos}
      mrrCoaching={mrrCoaching}
    />
  );
}
