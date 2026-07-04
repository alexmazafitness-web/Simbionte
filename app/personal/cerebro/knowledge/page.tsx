import { listKnCategories, listKnNotes, listSesionesPausadas } from "@/lib/personal/knowledge-queries";
import { KnowledgePageClient } from "@/components/shared/cerebro/KnowledgePageClient";

export default async function KnowledgePage() {
  const [categorias, notas, sesionesPausadas] = await Promise.all([
    listKnCategories(),
    listKnNotes(),
    listSesionesPausadas(),
  ]);

  return <KnowledgePageClient categorias={categorias} notas={notas} sesionesPausadas={sesionesPausadas} />;
}
