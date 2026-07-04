import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

export async function POST(req: Request) {
  const supabase = await createClient();

  try {
    await requireUserId(supabase);
  } catch {
    return Response.json({ error: "No autenticado" }, { status: 401 });
  }

  const secreto = process.env.CREDENTIALS_SECRET;
  if (!secreto) {
    return Response.json({ error: "CREDENTIALS_SECRET no configurada" }, { status: 500 });
  }

  const { id } = await req.json() as { id?: string };
  if (!id) return Response.json({ error: "Falta id" }, { status: 400 });

  // RLS de personal.credenciales limita esta select a filas del propio owner.
  const { data: row, error: selectError } = await supabase
    .schema("personal")
    .from("credenciales")
    .select("valor_cifrado")
    .eq("id", id)
    .single();
  if (selectError || !row) {
    return Response.json({ error: "Credencial no encontrada" }, { status: 404 });
  }

  const { data: valor, error: descifrarError } = await supabase
    .schema("personal")
    .rpc("descifrar_valor", { valor_cifrado: row.valor_cifrado, secreto });
  if (descifrarError) {
    return Response.json({ error: "No se pudo descifrar" }, { status: 500 });
  }

  return Response.json({ valor });
}
