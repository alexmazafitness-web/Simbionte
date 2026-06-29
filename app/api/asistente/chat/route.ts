import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { MESES_CICLO, type Recurrencia } from "@/lib/coaching/constants";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function nDaysISO(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfWeekISO() {
  const d = new Date();
  const dow = d.getDay(); // 0=dom
  d.setDate(d.getDate() - (dow === 0 ? 6 : dow - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function startOfMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

// ─── Business snapshot ────────────────────────────────────────────────────────

async function buildSnapshot(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  const hoy       = hoyISO();
  const hoy7      = nDaysISO(7);
  const semanaIni = startOfWeekISO();
  const mesIni    = startOfMonthISO();
  const hace30    = nDaysISO(-30);

  const [
    clientesRes,
    mesociclosRes,
    onboardingsRes,
    leadsRes,
    suscripcionesRes,
    tareasRes,
    tareasSemanaRes,
    revisionesHechasSemRes,
    contenidoRes,
  ] = await Promise.allSettled([
    supabase.schema("coaching").from("clientes")
      .select("id, nombre, estado, fecha_inicio, proxima_revision")
      .neq("estado", "eliminado"),

    supabase.schema("coaching").from("mesociclos")
      .select("cliente_id, fecha_fin, clientes ( nombre )")
      .eq("estado", "en_curso")
      .lte("fecha_fin", hoy7),

    supabase.schema("coaching").from("onboarding")
      .select("fecha_inicio, estado, clientes ( nombre ), onboarding_pasos ( completado )")
      .eq("estado", "en_progreso"),

    supabase.schema("coaching").from("leads")
      .select("estado")
      .neq("estado", "cliente")
      .neq("estado", "descartado"),

    supabase.schema("coaching").from("suscripciones")
      .select("cliente_id, precio, recurrencia, proximo_pago, estado, fecha_inicio")
      .eq("estado", "activa"),

    supabase.schema("personal").from("tasks")
      .select("title, is_priority, done, done_at")
      .eq("done", false)
      .or(`due_date.is.null,due_date.lte.${hoy}`)
      .limit(20),

    supabase.schema("personal").from("tasks")
      .select("id")
      .eq("done", true)
      .gte("done_at", semanaIni)
      .limit(50),

    supabase.schema("coaching").from("clientes")
      .select("nombre, proxima_revision")
      .eq("estado", "activo")
      .gte("proxima_revision", semanaIni)
      .lte("proxima_revision", hoy),

    supabase.schema("coaching").from("contenido_ig")
      .select("estado")
      .in("estado", ["idea", "produccion"]),
  ]);

  const clientes    = clientesRes.status === "fulfilled" ? (clientesRes.value.data ?? []) : [];
  const mesos       = mesociclosRes.status === "fulfilled" ? (mesociclosRes.value.data ?? []) : [];
  const onbs        = onboardingsRes.status === "fulfilled" ? (onboardingsRes.value.data ?? []) : [];
  const leads       = leadsRes.status === "fulfilled" ? (leadsRes.value.data ?? []) : [];
  const suscs       = suscripcionesRes.status === "fulfilled" ? (suscripcionesRes.value.data ?? []) : [];
  const tareasPend  = tareasRes.status === "fulfilled" ? (tareasRes.value.data ?? []) : [];
  const tareasHechas = tareasSemanaRes.status === "fulfilled" ? (tareasSemanaRes.value.data ?? []) : [];
  const revSem      = revisionesHechasSemRes.status === "fulfilled" ? (revisionesHechasSemRes.value.data ?? []) : [];
  const contenido   = contenidoRes.status === "fulfilled" ? (contenidoRes.value.data ?? []) : [];

  // Computed metrics
  const activos   = clientes.filter((c: { estado: string }) => c.estado === "activo");
  const bajas     = clientes.filter((c: { estado: string; fecha_inicio?: string | null }) =>
    c.estado === "baja" && c.fecha_inicio && c.fecha_inicio >= hace30,
  );
  const nuevos    = activos.filter((c: { fecha_inicio: string | null }) => c.fecha_inicio && c.fecha_inicio >= mesIni);

  const mrr = suscs.reduce((sum: number, s: { precio: number; recurrencia: string }) => {
    return sum + s.precio / (MESES_CICLO[s.recurrencia as Recurrencia] ?? 1);
  }, 0);

  // Revisiones
  type ClienteRow = { nombre: string; proxima_revision: string | null | undefined };
  const revVencidas = (activos as unknown as ClienteRow[]).filter(
    (c) => c.proxima_revision && c.proxima_revision <= hoy,
  );

  // Pagos
  const pagosPend = suscs.filter((s: { proximo_pago?: string | null }) => s.proximo_pago && s.proximo_pago <= hoy7);
  const pagosVencidos = suscs.filter((s: { proximo_pago?: string | null }) => s.proximo_pago && s.proximo_pago < hoy);

  // Leads por etapa
  const leadsPorEtapa = leads.reduce((acc: Record<string, number>, l: { estado: string }) => {
    acc[l.estado] = (acc[l.estado] ?? 0) + 1;
    return acc;
  }, {});

  // Onboardings con pasos pendientes
  const onbsDetalle = onbs.map((o: {
    fecha_inicio: string;
    clientes: unknown;
    onboarding_pasos: { completado: boolean }[];
  }) => {
    const nombre = (o.clientes as { nombre: string } | null)?.nombre ?? "—";
    const dias = Math.floor((Date.now() - new Date(o.fecha_inicio + "T12:00:00").getTime()) / 86_400_000);
    const pasosPend = (o.onboarding_pasos ?? []).filter((p) => !p.completado).length;
    return `${nombre} (D+${dias}, ${pasosPend} pasos pendientes)`;
  });

  const mesosDetalle = mesos.map((m: { fecha_fin?: string | null; clientes: unknown }) => {
    const nombre = (m.clientes as { nombre: string } | null)?.nombre ?? "—";
    const dias = m.fecha_fin
      ? Math.floor((new Date(m.fecha_fin + "T12:00:00").getTime() - Date.now()) / 86_400_000)
      : null;
    const diasStr = dias === null ? "?" : dias < 0 ? `vencido ${Math.abs(dias)}d` : dias === 0 ? "hoy" : `${dias}d`;
    return `${nombre} (${diasStr})`;
  });

  const lines: string[] = [
    `SNAPSHOT DEL NEGOCIO — ${hoy}`,
    "",
    `CLIENTES:`,
    `  Activos: ${activos.length} | MRR: ${Math.round(mrr)}€ / objetivo 2.000€`,
    `  Nuevos este mes: ${nuevos.length}`,
    `  Bajas últimos 30 días: ${bajas.length}`,
    "",
    `REVISIONES:`,
    `  Vencidas hoy: ${revVencidas.length}${revVencidas.length > 0 ? " — " + revVencidas.slice(0, 5).map((c) => c.nombre).join(", ") : ""}`,
    `  Realizadas esta semana: ${revSem.length}`,
    "",
    `MESOCICLOS a renovar (≤7 días): ${mesos.length}${mesos.length > 0 ? " — " + mesosDetalle.join(" | ") : ""}`,
    "",
    `ONBOARDINGS activos: ${onbs.length}${onbs.length > 0 ? "\n  " + onbsDetalle.join("\n  ") : ""}`,
    "",
    `LEADS activos: ${leads.length}${leads.length > 0 ? " — " + Object.entries(leadsPorEtapa).map(([k, v]) => `${k}: ${v}`).join(", ") : ""}`,
    "",
    `PAGOS:`,
    `  Próximos vencimientos (7 días): ${pagosPend.length}`,
    `  Vencidos: ${pagosVencidos.length}`,
    "",
    `TAREAS:`,
    `  Pendientes: ${tareasPend.length}${tareasPend.length > 0 ? "\n  " + (tareasPend as { title: string; is_priority: boolean }[]).slice(0, 8).map((t) => `${t.is_priority ? "⭐" : "·"} ${t.title}`).join("\n  ") : ""}`,
    `  Completadas esta semana: ${tareasHechas.length}`,
    "",
    `CONTENIDO IG en pipeline: ${contenido.length} piezas`,
  ];

  return lines.join("\n");
}

// ─── Memory extraction (fire-and-forget) ─────────────────────────────────────

async function extractMemoriesIfNeeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  ownerId: string,
  anthropic: Anthropic,
) {
  const { data: msgs } = await supabase
    .schema("personal")
    .from("asistente_conversaciones")
    .select("rol, mensaje")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (!msgs || msgs.length < 6) return;

  const conversation = [...msgs].reverse().map((m: { rol: string; mensaje: string }) => `${m.rol === "user" ? "Alex" : "Asistente"}: ${m.mensaje}`).join("\n\n");

  const resp = await anthropic.messages.create({
    model:      "claude-haiku-4-5-20251001",
    max_tokens: 512,
    system:     `Extrae de esta conversación los puntos clave que vale la pena recordar en futuras sesiones.
Solo incluye información no obvia: decisiones, prioridades cambiadas, preferencias del usuario, datos importantes sobre clientes.
Devuelve ÚNICAMENTE un JSON array (sin markdown) con objetos:
{ "contenido": "descripción concisa", "categoria": "prioridad|decision|preferencia|contexto_cliente|objetivo", "relevancia": 1-10 }
Si no hay nada relevante, devuelve [].`,
    messages: [{ role: "user", content: conversation }],
  });

  const raw = resp.content[0].type === "text" ? resp.content[0].text.trim() : "[]";
  let memories: { contenido: string; categoria: string; relevancia: number }[] = [];
  try { memories = JSON.parse(raw.replace(/```json?\s*/gi, "").replace(/```/g, "").trim()); } catch { return; }
  if (!Array.isArray(memories) || memories.length === 0) return;

  await supabase.schema("personal").from("asistente_memoria").insert(
    memories.map((m) => ({ owner_id: ownerId, contenido: m.contenido, categoria: m.categoria, relevancia: m.relevancia ?? 5 })),
  );
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  const ownerId  = await requireUserId(supabase);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const body = await req.json() as { mensaje: string; tipo?: string };
  const { mensaje, tipo } = body;

  const isGreeting = tipo === "saludo";
  const anthropic  = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const hoy        = hoyISO();

  // ── Save user message (if not a greeting trigger) ──────────────────────────
  if (!isGreeting && mensaje) {
    await supabase.schema("personal").from("asistente_conversaciones").insert({
      owner_id: ownerId, rol: "user", mensaje,
    });
  }

  // ── Collect context in parallel ────────────────────────────────────────────
  const [snapshot, memorias, historialDB, horarioMeta] = await Promise.all([
    buildSnapshot(supabase),

    supabase.schema("personal").from("asistente_memoria")
      .select("contenido, categoria, relevancia")
      .eq("owner_id", ownerId)
      .order("relevancia", { ascending: false })
      .limit(12),

    supabase.schema("personal").from("asistente_conversaciones")
      .select("rol, mensaje")
      .eq("owner_id", ownerId)
      .gte("created_at", `${hoy}T00:00:00`)
      .order("created_at", { ascending: false })
      .limit(20),

    supabase.schema("personal").from("meta")
      .select("value")
      .eq("key", "asistente_horario")
      .maybeSingle(),
  ]);

  const horario = (horarioMeta.data?.value as { entre_semana?: { inicio: string; horas: number }; finde?: { inicio: string; horas: number } } | null) ?? {
    entre_semana: { inicio: "18:00", horas: 2 },
    finde:        { inicio: "09:00", horas: 5 },
  };
  const esFinde = new Date().getDay() === 0 || new Date().getDay() === 6;
  const horarioHoy = esFinde ? horario.finde : horario.entre_semana;
  const horaInicioHoy   = horarioHoy?.inicio ?? "18:00";
  const horasDisponibles = horarioHoy?.horas ?? 2;

  const memoriasStr = (memorias.data ?? []).length > 0
    ? (memorias.data as { contenido: string; categoria: string }[])
        .map((m) => `[${m.categoria}] ${m.contenido}`)
        .join("\n")
    : "Sin memorias anteriores.";

  // Build Claude message history (oldest first, last 10 messages)
  const historial = [...(historialDB.data ?? [])].reverse().slice(-10);
  const claudeHistory: { role: "user" | "assistant"; content: string }[] = historial
    .filter((m: { rol: string }) => !isGreeting || m.rol !== "user")
    .map((m: { rol: string; mensaje: string }) => ({
      role: m.rol === "user" ? "user" : "assistant",
      content: m.mensaje,
    }));

  // ── System prompt ─────────────────────────────────────────────────────────
  const systemPrompt = `Eres el asistente de operaciones de Alex Maza, coach de fitness online.
Conoces su negocio al detalle y actúas como un jefe de operaciones que le ayuda a priorizar, organizarse y tomar decisiones.

PERFIL DE ALEX:
- Negocio de asesoría fitness online, trabaja solo
- Objetivo: 2.000€ de MRR
- Clientes en revisión semanal, mesociclos cada 2-4 semanas
- Horario disponible hoy: desde las ${horaInicioHoy} durante ${horasDisponibles}h

CAPACIDADES:
- Responder preguntas sobre el estado del negocio usando los datos del snapshot
- Priorizar tareas y organizar el día de forma concreta
- Generar planes del día por bloques horarios cuando te los pidan
- Recordar contexto de conversaciones anteriores (memorias)

REGLAS ESTRICTAS:
- Basa SIEMPRE tus respuestas en los datos del snapshot — no inventes cifras
- Si no tienes un dato concreto, dilo claramente
- Responde en español, tuteo, tono profesional y directo sin rodeos
- Respuestas concisas (2-4 párrafos) salvo que pidan un plan o análisis detallado

FORMATO DE PLANES (úsalo cuando pidan "planifica mi día" o similar):
**HH:MM–HH:MM | Frente de trabajo**
Título del bloque
• Paso 1 concreto
• Paso 2 concreto

[descanso 10 min]

**HH:MM–HH:MM | Siguiente frente**
...

Usa el horario disponible hoy (inicio: ${horaInicioHoy}, duración: ${horasDisponibles}h) para calcular los bloques.
Prioriza: primero Servicio (revisiones vencidas, mesociclos, onboardings), después lo demás.

${snapshot}

MEMORIAS RELEVANTES DE CONVERSACIONES ANTERIORES:
${memoriasStr}`;

  // ── Build final message for Claude ─────────────────────────────────────────
  const finalMensaje = isGreeting
    ? `Saluda a Alex con un resumen ejecutivo breve del estado de su negocio hoy (2-4 líneas con los datos más relevantes del snapshot) y pregúntale qué necesita. Sé directo y actionable.`
    : mensaje;

  const allMessages: { role: "user" | "assistant"; content: string }[] = [
    ...claudeHistory,
    { role: "user", content: finalMensaje },
  ];

  // ── Stream response ────────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      try {
        const stream = await anthropic.messages.create({
          model:      "claude-sonnet-4-6",
          max_tokens: 1024,
          system:     systemPrompt,
          messages:   allMessages,
          stream:     true,
        });

        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            const text = event.delta.text;
            fullResponse += text;
            controller.enqueue(encoder.encode(text));
          }
        }
      } catch (err) {
        console.error("[asistente/chat] stream error:", err);
        controller.enqueue(encoder.encode("\n[Error generando respuesta]"));
      } finally {
        // Save assistant response
        await supabase.schema("personal").from("asistente_conversaciones").insert({
          owner_id: ownerId, rol: "assistant", mensaje: fullResponse || "[sin respuesta]",
        });

        // Trigger memory extraction every 10 messages (fire-and-forget)
        const { count } = await supabase.schema("personal").from("asistente_conversaciones")
          .select("id", { count: "exact", head: true })
          .eq("owner_id", ownerId)
          .gte("created_at", `${hoy}T00:00:00`);

        if (count && count % 10 === 0) {
          void extractMemoriesIfNeeded(supabase, ownerId, anthropic);
        }

        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type":   "text/plain; charset=utf-8",
      "Cache-Control":  "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
