import { listKnCategories, listKnNotes, listSesionesPausadas } from "@/lib/personal/knowledge-queries";
import { KnowledgePageClient } from "@/components/shared/cerebro/KnowledgePageClient";

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ nota?: string }>;
}) {
  const params = await searchParams;
  const [categorias, notas, sesionesPausadas] = await Promise.all([
    listKnCategories(),
    listKnNotes(),
    listSesionesPausadas(),
  ]);

  return (
    <KnowledgePageClient
      categorias={categorias}
      notas={notas}
      sesionesPausadas={sesionesPausadas}
      notaPrefillId={params.nota}
    />
  );
}
