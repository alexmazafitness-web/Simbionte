import { listTarjetas } from "@/lib/coaching/negocio-queries";
import { NegocioPageClient } from "@/components/shared/negocio/NegocioPageClient";

export default async function NegocioPage() {
  const tarjetas = await listTarjetas();
  return <NegocioPageClient tarjetas={tarjetas} />;
}
