import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function addHorasToTime(time: string, horas: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMin = h * 60 + m + Math.round(horas * 60);
  return `${String(Math.floor(totalMin / 60) % 24).padStart(2, "0")}:${String(totalMin % 60).padStart(2, "0")}`;
}

function fmt(date: string): string {
  const d = new Date(date + "T12:00:00");
  const dias = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
  const meses = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${dias[d.getDay()]} ${d.getDate()} de ${meses[d.getMonth()]}`;
}

function fmtTime(iso: string): string {
  return iso.slice(11, 16);
}

function stripMarkdown(text: string): string {
  return text
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const body = await req.json() as { hora_inicio: string; horas_disponibles: number };
  const { hora_inicio, horas_disponibles } = body;

  const hoy = new Date();
  const hoyISO = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
  const horaFin = addHorasToTime(hora_inicio, horas_disponibles);

  // ── Collect data from Supabase in parallel ──────────────────────────────────

  const [
    revisionesRes,
    mesociclosRes,
    onboardingsRes,
    tareasRes,
    recordatoriosRes,
    eventosHoyRes,
    contenidoRes,
  ] = await Promise.allSettled([
    // Revisiones vencidas
    supabase
      .schema("coaching")
      .from("clientes")
      .select("nombre, proxima_revision")
      .eq("estado", "activo")
      .lte("proxima_revision", hoyISO)
      .order("proxima_revision"),

    // Mesociclos terminando pronto
    supabase
      .schema("coaching")
      .from("mesociclos")
      .select("fecha_fin, clientes ( nombre )")
      .eq("estado", "en_curso")
      .lte("fecha_fin", addHorasToTime(hoyISO.replace(/-/g, ":"), 0).replace(/ /g, "T") || hoyISO)
      .order("fecha_fin"),

    // Onboardings activos
    supabase
      .schema("coaching")
      .from("onboarding")
      .select("fecha_inicio, clientes ( nombre ), onboarding_pasos ( completado )")
      .eq("estado", "en_progreso"),

    // Tareas pendientes
    supabase
      .schema("personal")
      .from("tasks")
      .select("title, is_priority, due_date")
      .eq("done", false)
      .or(`due_date.is.null,due_date.lte.${hoyISO}`)
      .order("is_priority", { ascending: false })
      .limit(15),

    // Recordatorios de hoy
    supabase
      .schema("personal")
      .from("reminders")
      .select("title")
      .eq("done", false)
      .gte("remind_at", `${hoyISO}T00:00:00`)
      .lt("remind_at", `${hoyISO}T23:59:59`),

    // Eventos ya fijados hoy
    supabase
      .schema("personal")
      .from("events")
      .select("title, start_at, end_at")
      .gte("start_at", `${hoyISO}T00:00:00`)
      .lt("start_at", `${hoyISO}T23:59:59`)
      .order("start_at"),

    // Contenido pendiente
    supabase
      .schema("coaching")
      .from("contenido_ig")
      .select("titulo, tipo, estado")
      .in("estado", ["idea", "produccion"])
      .limit(8),
  ]);

  // ── Mesociclos query (needs join-style rewrite) ─────────────────────────────
  // The mesociclos query above won't work perfectly with date math — let's redo it properly:
  const hoy7ISO = (() => {
    const d = new Date(hoy);
    d.setDate(d.getDate() + 7);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const { data: mesosData } = await supabase
    .schema("coaching")
    .from("mesociclos")
    .select("fecha_fin, clientes ( nombre )")
    .eq("estado", "en_curso")
    .lte("fecha_fin", hoy7ISO)
    .order("fecha_fin");

  // ── Build context strings ───────────────────────────────────────────────────

  const revisiones = revisionesRes.status === "fulfilled" ? (revisionesRes.value.data ?? []) : [];
  const onboardings = onboardingsRes.status === "fulfilled" ? (onboardingsRes.value.data ?? []) : [];
  const tareas = tareasRes.status === "fulfilled" ? (tareasRes.value.data ?? []) : [];
  const recordatorios = recordatoriosRes.status === "fulfilled" ? (recordatoriosRes.value.data ?? []) : [];
  const eventosHoy = eventosHoyRes.status === "fulfilled" ? (eventosHoyRes.value.data ?? []) : [];
  const contenido = contenidoRes.status === "fulfilled" ? (contenidoRes.value.data ?? []) : [];
  const mesos = mesosData ?? [];

  const eventosStr = eventosHoy.length === 0
    ? "Ninguno"
    : eventosHoy.map((e: { title: string; start_at: string; end_at: string | null }) =>
        `• ${e.title} (${fmtTime(e.start_at)}${e.end_at ? `–${fmtTime(e.end_at)}` : ""})`
      ).join("\n");

  const revisionesStr = revisiones.length === 0
    ? "Ninguna"
    : revisiones.map((r: { nombre: string; proxima_revision: string | null }) => {
        const diasVencida = r.proxima_revision
          ? Math.floor((hoy.getTime() - new Date(r.proxima_revision + "T12:00:00").getTime()) / 86_400_000)
          : 0;
        return `• ${r.nombre} — ${diasVencida}d vencida`;
      }).join("\n");

  const mesosStr = mesos.length === 0
    ? "Ninguno"
    : mesos.map((m: { fecha_fin: string | null; clientes: unknown }) => {
        const nombre = (m.clientes as { nombre: string } | null)?.nombre ?? "—";
        const dias = m.fecha_fin
          ? Math.floor((new Date(m.fecha_fin + "T12:00:00").getTime() - hoy.getTime()) / 86_400_000)
          : null;
        const diasStr = dias === null ? "?" : dias < 0 ? `${Math.abs(dias)}d vencido` : dias === 0 ? "hoy" : `${dias}d restantes`;
        return `• ${nombre} — termina el ${m.fecha_fin ?? "?"} (${diasStr})`;
      }).join("\n");

  const onboardingsStr = onboardings.length === 0
    ? "Ninguno"
    : onboardings.map((o: { fecha_inicio: string; clientes: unknown; onboarding_pasos: unknown[] }) => {
        const nombre = (o.clientes as { nombre: string } | null)?.nombre ?? "—";
        const dias = Math.floor((hoy.getTime() - new Date(o.fecha_inicio + "T12:00:00").getTime()) / 86_400_000);
        const pasos = o.onboarding_pasos as { completado: boolean }[];
        const pendientes = pasos.filter((p) => !p.completado).length;
        return `• ${nombre} — D+${dias} — ${pendientes} pasos pendientes`;
      }).join("\n");

  const tareasStr = tareas.length === 0
    ? "Ninguna"
    : tareas.map((t: { title: string; is_priority: boolean; due_date: string | null }) =>
        `• ${t.title}${t.is_priority ? " ⭐" : ""}${t.due_date ? ` (vence ${t.due_date})` : ""}`
      ).join("\n");

  const recordatoriosStr = recordatorios.length === 0
    ? "Ninguno"
    : recordatorios.map((r: { title: string }) => `• ${r.title}`).join("\n");

  const contenidoStr = contenido.length === 0
    ? "Ninguno"
    : contenido.map((c: { titulo: string; tipo: string | null; estado: string }) =>
        `• ${c.titulo} (${c.tipo ?? "?"}, ${c.estado})`
      ).join("\n");

  // ── Build prompt ─────────────────────────────────────────────────────────────

  const systemPrompt = `Eres el asistente de planificación diaria de Alex Maza, entrenador personal y coach de fitness online.
Tu tarea: analizar todo lo pendiente y proponer un plan del día en bloques horarios realistas.

REGLAS:
- Un bloque = un frente: Servicio (trabajo con clientes), Contenido (Instagram/redes), Estudio (formación), Personal
- Duración: 20–90 min por bloque de trabajo
- Descanso de 10 min entre bloques (más de un bloque seguido)
- Prioridad: revisiones vencidas → mesociclos que acaban → onboardings activos → tareas ⭐ prioritarias → contenido → resto
- Si el tiempo no alcanza, el resto va en "pospuesto" con motivo breve
- Los pasos deben ser MUY concretos y accionables (2–4 por bloque)
- Respeta los eventos ya fijados — no solapes
- Si no hay nada urgente en un frente, prioriza otro; no inventes trabajo

FORMATO DE RESPUESTA — devuelve ÚNICAMENTE JSON válido, sin markdown:
{
  "bloques": [
    {
      "hora_inicio": "HH:MM",
      "hora_fin": "HH:MM",
      "frente": "Servicio|Contenido|Estudio|Personal",
      "titulo": "título concreto del bloque",
      "pasos": ["paso 1", "paso 2"]
    },
    {
      "tipo": "descanso",
      "hora_inicio": "HH:MM",
      "hora_fin": "HH:MM"
    }
  ],
  "pospuesto": ["descripción de lo pospuesto — motivo"]
}`;

  const userPrompt = `Fecha: ${fmt(hoyISO)}
Hora de inicio: ${hora_inicio}
Tiempo disponible: ${horas_disponibles}h (hasta las ${horaFin})

EVENTOS YA FIJADOS HOY (respetar, no solapar):
${eventosStr}

── SERVICIO ──────────────────────────────────────
Revisiones pendientes/vencidas (${revisiones.length}):
${revisionesStr}

Mesociclos a renovar en ≤7 días (${mesos.length}):
${mesosStr}

Onboardings activos (${onboardings.length}):
${onboardingsStr}

── CONTENIDO ─────────────────────────────────────
Piezas en pipeline (${contenido.length}):
${contenidoStr}

── PERSONAL ──────────────────────────────────────
Tareas pendientes (${tareas.length}):
${tareasStr}

Recordatorios de hoy (${recordatorios.length}):
${recordatoriosStr}`;

  // ── Call Claude ───────────────────────────────────────────────────────────────

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 2048,
    system:     systemPrompt,
    messages:   [{ role: "user", content: userPrompt }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  const cleaned = stripMarkdown(raw);

  try {
    const plan = JSON.parse(cleaned);
    return Response.json(plan);
  } catch {
    console.error("[planificar] JSON parse failed:", cleaned.slice(0, 200));
    return Response.json({ error: "El plan generado no es JSON válido", raw: cleaned }, { status: 500 });
  }
}
