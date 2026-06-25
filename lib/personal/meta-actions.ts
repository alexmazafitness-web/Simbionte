"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { RevisionVM } from "./meta";

const PATH = "/personal/cerebro/revision";

export async function guardarRevision(revision: RevisionVM) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("personal")
    .from("meta")
    .upsert({ owner_id: ownerId, key: "review", value: revision }, { onConflict: "owner_id,key" });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function guardarPalanca(palanca: string) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase
    .schema("personal")
    .from("meta")
    .upsert({ owner_id: ownerId, key: "palanca", value: palanca }, { onConflict: "owner_id,key" });
  if (error) throw error;
  revalidatePath("/personal/cerebro/norte");
}
