import { listKnCategories, listKnNotes } from "@/lib/personal/knowledge-queries";
import { KnowledgePageClient } from "@/components/shared/cerebro/KnowledgePageClient";

export default async function KnowledgePage() {
  const [categorias, notas] = await Promise.all([
    listKnCategories(),
    listKnNotes(),
  ]);

  return <KnowledgePageClient categorias={categorias} notas={notas} />;
}
