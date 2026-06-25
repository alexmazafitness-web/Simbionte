import { listKnCategories, listKnNotes, listKnPrinciples, listKnSystems } from "@/lib/personal/knowledge-queries";
import { KnowledgePageClient } from "@/components/shared/cerebro/KnowledgePageClient";

export default async function KnowledgePage() {
  const [categorias, notas, principios, sistemas] = await Promise.all([
    listKnCategories(),
    listKnNotes(),
    listKnPrinciples(),
    listKnSystems(),
  ]);

  return <KnowledgePageClient categorias={categorias} notas={notas} principios={principios} sistemas={sistemas} />;
}
