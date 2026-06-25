import { createClient } from "@/lib/supabase/server";
import type { InfraBucket } from "./constants";
import type { InfraItemVM } from "./infra";

type InfraRow = {
  id: string;
  bucket: InfraBucket;
  name: string;
  description: string | null;
  platform: string | null;
  url: string | null;
  note: string | null;
};

export async function listInfra(): Promise<InfraItemVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("infra")
    .select("id, bucket, name, description, platform, url, note")
    .order("created_at");
  if (error) throw error;
  return (data as InfraRow[]).map((row) => ({
    id: row.id,
    bucket: row.bucket,
    name: row.name,
    desc: row.description,
    platform: row.platform,
    url: row.url,
    note: row.note,
  }));
}
