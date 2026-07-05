import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { enviarNotificacionATodos } from "@/lib/push/send";

// Envío manual — útil para probar el flujo end-to-end y para automatizaciones
// futuras que quieran disparar un aviso puntual. Requiere sesión (a
// diferencia del cron, que no la tiene).
export async function POST(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);

  const body = await req.json() as { title?: string; body?: string; url?: string };
  if (!body.title || !body.body) {
    return Response.json({ error: "Faltan title o body" }, { status: 400 });
  }

  const resultado = await enviarNotificacionATodos({ title: body.title, body: body.body, url: body.url });
  return Response.json(resultado);
}
