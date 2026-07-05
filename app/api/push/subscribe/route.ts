import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

export async function POST(req: Request) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  const body = await req.json() as {
    endpoint?: string;
    keys?: { p256dh?: string; auth?: string };
    userAgent?: string;
  };

  if (!body.endpoint || !body.keys?.p256dh || !body.keys?.auth) {
    return Response.json({ error: "Suscripción incompleta" }, { status: 400 });
  }

  // onConflict por endpoint: si el navegador renueva la suscripción del mismo
  // dispositivo con un endpoint nuevo, esto entra como fila nueva (correcto,
  // es efectivamente otro registro); si repite el mismo endpoint (recarga),
  // actualiza en vez de duplicar.
  const { error } = await supabase.schema("personal").from("push_subscriptions").upsert(
    {
      owner_id:   ownerId,
      endpoint:   body.endpoint,
      p256dh:     body.keys.p256dh,
      auth:       body.keys.auth,
      user_agent: body.userAgent ?? null,
    },
    { onConflict: "endpoint" },
  );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
