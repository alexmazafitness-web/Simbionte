import { listChecklist, listPiezas } from "@/lib/coaching/contenido-queries";
import { ContenidoPageClient } from "@/components/shared/contenido/ContenidoPageClient";

export default async function ContenidoPage() {
  const [piezas, checklist] = await Promise.all([listPiezas(), listChecklist()]);
  return <ContenidoPageClient piezas={piezas} checklist={checklist} />;
}
