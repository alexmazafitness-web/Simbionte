"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { InfraBucket } from "./constants";

const PATH = "/personal/cerebro/infra";

export type InfraItemInput = {
  bucket: InfraBucket;
  name: string;
  desc: string;
  platform: string;
  url: string;
  note: string;
};

export async function crearInfraItem(input: InfraItemInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);
  const { error } = await supabase.schema("personal").from("infra").insert({
    owner_id: ownerId,
    bucket: input.bucket,
    name: input.name,
    description: input.desc || null,
    platform: input.platform || null,
    url: input.url || null,
    note: input.note || null,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarInfraItem(id: string, input: InfraItemInput) {
  const supabase = await createClient();
  const { error } = await supabase
    .schema("personal")
    .from("infra")
    .update({
      bucket: input.bucket,
      name: input.name,
      description: input.desc || null,
      platform: input.platform || null,
      url: input.url || null,
      note: input.note || null,
    })
    .eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarInfraItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("infra").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
