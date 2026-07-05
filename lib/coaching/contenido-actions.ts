"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const PATH = "/coaching/contenido";

export async function toggleChecklistItem(key: string, checked: boolean) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("coaching")
    .from("contenido_checklist")
    .upsert({ owner_id: ownerId, key, checked }, { onConflict: "owner_id,key" });
  if (error) throw error;
  revalidatePath(PATH);
}
