"use server";

import { createClient } from "@/lib/supabase/server";

export async function actualizarNombre(nombre: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ data: { name: nombre.trim() } });
  if (error) throw error;
}
