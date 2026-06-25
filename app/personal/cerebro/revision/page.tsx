import { getRevision } from "@/lib/personal/meta-queries";
import { RevisionPageClient } from "@/components/shared/cerebro/RevisionPageClient";

export default async function RevisionPage() {
  const revision = await getRevision();
  return <RevisionPageClient revision={revision} />;
}
