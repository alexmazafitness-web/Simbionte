import webpush from "web-push";
import { createServiceClient } from "@/lib/supabase/service";

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

function vapidConfigurado(): boolean {
  return !!(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY && process.env.VAPID_SUBJECT);
}

function configurarVapid() {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT!,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!,
  );
}

// Envía `payload` a TODAS las suscripciones registradas (esta app es de un
// único owner, así que "todas" y "las del owner" son lo mismo). Cada envío
// se maneja de forma aislada: si uno falla, los demás continúan. Un endpoint
// caducado (404/410 — el navegador ya lo invalidó) se borra de la tabla en
// vez de seguir reintentándolo en cada cron futuro.
export async function enviarNotificacionATodos(payload: PushPayload): Promise<{ enviadas: number; fallidas: number }> {
  if (!vapidConfigurado()) {
    console.error("[push] VAPID no configurado — abortando envío");
    return { enviadas: 0, fallidas: 0 };
  }
  configurarVapid();

  const supabase = createServiceClient();
  const { data: subs, error } = await supabase
    .schema("personal")
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth");
  if (error || !subs) {
    console.error("[push] no se pudieron leer las suscripciones:", error);
    return { enviadas: 0, fallidas: 0 };
  }

  let enviadas = 0;
  let fallidas = 0;

  await Promise.allSettled(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify({ title: payload.title, body: payload.body, url: payload.url ?? "/" }),
        );
        enviadas += 1;
      } catch (err) {
        fallidas += 1;
        const statusCode = (err as { statusCode?: number } | null)?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          // Endpoint muerto: limpiar para no reintentar en el próximo cron.
          await supabase.schema("personal").from("push_subscriptions").delete().eq("id", s.id);
        } else {
          console.error(`[push] fallo enviando a suscripción ${s.id}:`, err);
        }
      }
    }),
  );

  return { enviadas, fallidas };
}
