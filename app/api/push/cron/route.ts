import { createServiceClient } from "@/lib/supabase/service";
import { enviarNotificacionATodos, type PushPayload } from "@/lib/push/send";

// El cron está fijado a las 6:00 UTC = 8:00 en España (ver vercel.json). A
// esa hora Madrid (UTC+1/+2) YA cruzó la medianoche hace 6-8h, así que
// `new Date()` en el servidor (UTC) y el calendario de Madrid coinciden en
// el mismo día — a diferencia de "hoy" calculado cerca de medianoche (ver
// CLAUDE.md), aquí SÍ es seguro derivar la fecha en el servidor porque la
// hora de ejecución se eligió específicamente para evitar ese cruce.
function hoyISO(): string {
  const d = new Date();
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function addDaysISO(iso: string, dias: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + dias);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function diasEntre(desdeISO: string, hastaISO: string): number {
  const a = new Date(desdeISO + "T00:00:00Z").getTime();
  const b = new Date(hastaISO + "T00:00:00Z").getTime();
  return Math.round((b - a) / 86_400_000);
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const supabase = createServiceClient();
  const hoy = hoyISO();
  const notificaciones: PushPayload[] = [];

  // 1. Revisiones vencidas
  const { data: revisionesVencidas } = await supabase
    .schema("coaching")
    .from("clientes")
    .select("id")
    .eq("estado", "activo")
    .lt("proxima_revision", hoy);
  if (revisionesVencidas && revisionesVencidas.length > 0) {
    notificaciones.push({
      title: "⚠️ Revisiones pendientes",
      body:  `${revisionesVencidas.length} revisiones pendientes de pasar`,
      url:   "/coaching/clientes",
    });
  }

  // 2. Mesociclos que acaban en ≤ 3 días
  const { data: mesosProximos } = await supabase
    .schema("coaching")
    .from("mesociclos")
    .select("fecha_fin, clientes ( nombre )")
    .eq("estado", "en_curso")
    .gte("fecha_fin", hoy)
    .lte("fecha_fin", addDaysISO(hoy, 3));
  for (const m of mesosProximos ?? []) {
    const nombre = (m.clientes as unknown as { nombre: string } | null)?.nombre ?? "cliente";
    const dias = diasEntre(hoy, m.fecha_fin as string);
    notificaciones.push({
      title: "🔄 Mesociclo terminando",
      body:  `Mesociclo de ${nombre} acaba en ${dias === 0 ? "hoy" : dias === 1 ? "1 día" : `${dias} días`}`,
      url:   "/coaching/mesociclos",
    });
  }

  // 3. Pagos que vencen mañana
  const manana = addDaysISO(hoy, 1);
  const { data: pagosManana } = await supabase
    .schema("coaching")
    .from("suscripciones")
    .select("clientes ( nombre )")
    .eq("estado", "activa")
    .eq("proximo_pago", manana);
  for (const s of pagosManana ?? []) {
    const nombre = (s.clientes as unknown as { nombre: string } | null)?.nombre ?? "cliente";
    notificaciones.push({
      title: "💰 Pago mañana",
      body:  `Pago de ${nombre} vence mañana`,
      url:   "/coaching/pagos",
    });
  }

  // 4. Onboardings con pasos vencidos (fecha_inicio + dia_offset < hoy, sin completar)
  const { data: onboardings } = await supabase
    .schema("coaching")
    .from("onboarding")
    .select("fecha_inicio, clientes ( nombre ), onboarding_pasos ( dia_offset, completado )")
    .eq("estado", "en_progreso");
  for (const o of onboardings ?? []) {
    const pasos = (o.onboarding_pasos ?? []) as { dia_offset: number; completado: boolean }[];
    const tieneVencido = pasos.some((p) => !p.completado && addDaysISO(o.fecha_inicio as string, p.dia_offset) < hoy);
    if (tieneVencido) {
      const nombre = (o.clientes as unknown as { nombre: string } | null)?.nombre ?? "cliente";
      notificaciones.push({
        title: "📋 Onboarding pendiente",
        body:  `Onboarding de ${nombre} tiene pasos pendientes`,
        url:   "/coaching/onboarding",
      });
    }
  }

  // Cada notificación se envía por separado; un fallo en una no bloquea las
  // demás (enviarNotificacionATodos ya aísla errores por suscripción).
  const resultados = await Promise.allSettled(notificaciones.map((n) => enviarNotificacionATodos(n)));

  return Response.json({
    generadas: notificaciones.length,
    resultados: resultados.map((r) => (r.status === "fulfilled" ? r.value : { enviadas: 0, fallidas: 0, error: true })),
  });
}
