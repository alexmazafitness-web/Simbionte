import { listChecklist } from "@/lib/coaching/contenido-queries";
import { listContenidoIdeas } from "@/lib/coaching/contenido-ideas-queries";
import { ContenidoPageClient } from "@/components/shared/contenido/ContenidoPageClient";

export default async function ContenidoPage() {
  const [ideas, checklist] = await Promise.all([listContenidoIdeas(), listChecklist()]);
  return <ContenidoPageClient ideas={ideas} checklist={checklist} />;
}
