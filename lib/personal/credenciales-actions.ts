"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { CredencialCategoria } from "./credenciales";

const PATH = "/personal/cerebro/infra";

function getSecreto(): string {
  const secreto = process.env.CREDENTIALS_SECRET;
  if (!secreto) throw new Error("CREDENTIALS_SECRET no configurada en el servidor.");
  return secreto;
}

export type CredencialInput = {
  nombre: string;
  categoria: CredencialCategoria;
  servicio: string;
  valor: string; // vacío en edición = no cambiar el valor cifrado existente
  descripcion: string;
  url: string;
};

export async function crearCredencial(input: CredencialInput) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const { data: valorCifrado, error: cifrarError } = await supabase
    .schema("personal")
    .rpc("cifrar_valor", { valor: input.valor, secreto: getSecreto() });
  if (cifrarError) throw cifrarError;

  const { error } = await supabase.schema("personal").from("credenciales").insert({
    owner_id:       ownerId,
    nombre:         input.nombre,
    categoria:      input.categoria,
    servicio:       input.servicio || null,
    valor_cifrado:  valorCifrado,
    descripcion:    input.descripcion || null,
    url:            input.url || null,
  });
  if (error) throw error;
  revalidatePath(PATH);
}

export async function editarCredencial(id: string, input: CredencialInput) {
  const supabase = await createClient();

  const update: Record<string, unknown> = {
    nombre:      input.nombre,
    categoria:   input.categoria,
    servicio:    input.servicio || null,
    descripcion: input.descripcion || null,
    url:         input.url || null,
  };

  // Campo valor vacío en edición → mantener el valor cifrado anterior intacto.
  if (input.valor.trim()) {
    const { data: valorCifrado, error: cifrarError } = await supabase
      .schema("personal")
      .rpc("cifrar_valor", { valor: input.valor, secreto: getSecreto() });
    if (cifrarError) throw cifrarError;
    update.valor_cifrado = valorCifrado;
  }

  const { error } = await supabase.schema("personal").from("credenciales").update(update).eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}

export async function eliminarCredencial(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.schema("personal").from("credenciales").delete().eq("id", id);
  if (error) throw error;
  revalidatePath(PATH);
}
