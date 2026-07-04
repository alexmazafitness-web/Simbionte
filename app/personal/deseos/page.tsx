import { listDeseosCategorias, listDeseos } from "@/lib/personal/deseos-queries";
import { DeseosPageClient } from "@/components/shared/cerebro/DeseosPageClient";

export default async function DeseosPage() {
  const [categorias, deseos] = await Promise.all([
    listDeseosCategorias(),
    listDeseos(),
  ]);

  return <DeseosPageClient categorias={categorias} deseos={deseos} />;
}
