import { listCrypto } from "@/lib/personal/finanzas-queries";
import { CryptoPageClient } from "@/components/shared/finanzas/CryptoPageClient";

export default async function CryptoPage() {
  const posiciones = await listCrypto();
  return <CryptoPageClient posiciones={posiciones} />;
}
