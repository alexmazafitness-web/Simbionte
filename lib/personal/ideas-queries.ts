import { createClient } from "@/lib/supabase/server";
import type { Front } from "./constants";
import type { IdeaEstado, IdeaVM } from "./ideas";

type IdeaRow = { id: string; title: string; front: Front; status: IdeaEstado };

export async function listIdeas(): Promise<IdeaVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("ideas")
    .select("id, title, front, status")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as IdeaRow[]).map((row) => ({
    id: row.id,
    text: row.title,
    front: row.front,
    estado: row.status,
  }));
}
