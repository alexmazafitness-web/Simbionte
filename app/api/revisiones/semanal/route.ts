import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { getDatosRevisionSemanal, getUltimasRevisiones } from "@/lib/personal/revision-queries";
import { getWeekBounds, fmtSemana, type RespuestasUsuario, type FeedbackIA } from "@/lib/personal/revision";
import { MESES_CICLO } from "@/lib/coaching/constants";

export async function POST(req: Request) {
  const supabase = await createClient();
  const ownerId = await requireUserId(supabase);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const { respuestasUsuario } = (await req.json()) as { respuestasUsuario: RespuestasUsuario };

  const [datosAuto, ultimasRevisiones] = await Promise.all([
    getDatosRevisionSemanal(),
    getUltimasRevisiones(4),
  ]);

  const { inicio, fin } = getWeekBounds();
  const semanaTitulo = fmtSemana(inicio, fin);

  // Build context string for Claude
  const datosStr = `
DATOS AUTOMÁTICOS DE LA SEMANA (${semanaTitulo}):

Tareas:
- Completadas esta semana: ${datosAuto.tareas.completadasSemana}
- Creadas esta semana: ${datosAuto.tareas.creadasSemana}
- Pendientes totales: ${datosAuto.tareas.pendientesTotales}

Coaching — Clientes:
- Clientes activos: ${datosAuto.clientes.activos}
- Nuevos esta semana: ${datosAuto.clientes.nuevosSemana}
- Bajas esta semana: ${datosAuto.clientes.bajasSemana}
- MRR actual: ${datosAuto.clientes.mrr}€
- Cuotas que vencen esta semana: ${datosAuto.suscripcionesVencenSemana}

Coaching — Leads:
- Total activos (sin descartados): ${datosAuto.leads.total}
- Leads nuevos esta semana: ${datosAuto.leads.nuevosSemana}
- Por etapa: ${Object.entries(datosAuto.leads.porEtapa).map(([k, v]) => `${k}(${v})`).join(", ") || "ninguno"}

Revisiones de clientes realizadas esta semana: ${datosAuto.revisionesClientes}
Notas de Knowledge añadidas esta semana: ${datosAuto.notasKnowledge}
`.trim();

  const historialStr =
    ultimasRevisiones.length > 0
      ? ultimasRevisiones
          .map((r) => {
            const fb = r.feedbackIA;
            return `Semana ${fmtSemana(r.semanaInicio, r.semanaFin)} — MRR: ${r.mrrSnapshot}€, Clientes: ${r.clientesActivosSnapshot}\nPalanca: ${fb?.palancaClave ?? "-"}\nResumen: ${fb?.resumenEjecutivo?.slice(0, 200) ?? "-"}`;
          })
          .join("\n\n")
      : "Sin revisiones anteriores disponibles.";

  const respuestasStr = `
RESPUESTAS DEL USUARIO:
1. Energía y foco (1-10): ${respuestasUsuario.energia || "(no respondido)"}
2. Contenido en Instagram: ${respuestasUsuario.instagram || "(no respondido)"}
3. Bloqueos o frenos: ${respuestasUsuario.bloqueos || "(no respondido)"}
4. Ventas / llamadas de ventas: ${respuestasUsuario.ventas || "(no respondido)"}
5. Mayor orgullo de la semana: ${respuestasUsuario.orgullo || "(no respondido)"}
`.trim();

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `Eres el copiloto estratégico de Alex Maza, un entrenador personal de fitness que gestiona un negocio de coaching online.
Haces la revisión semanal de su negocio y vida, analizando datos reales y respuestas subjetivas.

Tu tono: directo, honesto, energético. Sin suavizar verdades pero tampoco sin ser cruel. Como un buen mentor que conoce bien al usuario.
Alex usa este sistema para su vida entera: tareas personales, coaching de clientes, Instagram, finanzas, knowledge.

INSTRUCCIONES:
1. Analiza los datos objetivos y los subjetivos juntos — el número sin el contexto humano no dice nada.
2. Identifica patrones respecto al historial de semanas anteriores.
3. Sé específico: menciona cifras concretas, no generalidades.
4. Las tareas recomendadas deben ser accionables en la semana siguiente, no aspiraciones.
5. La palanca clave es UNA SOLA cosa — la de mayor impacto en el negocio esta semana concreta.
6. La pregunta de reflexión debe hacer pensar, no ser retórica.

Responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra:
{
  "resumenEjecutivo": "3-4 líneas que capturan la semana",
  "funcionaBien": ["máx 4 puntos positivos concretos"],
  "focoPrioritario": ["máx 3 áreas donde hay brecha o que necesitan más atención"],
  "tareasRecomendadas": ["5 tareas concretas para la semana siguiente, priorizadas"],
  "palancaClave": "una sola frase — la cosa que más mueve el negocio esta semana",
  "preguntaReflexion": "una pregunta que haga reflexionar profundo"
}`,
    messages: [
      {
        role: "user",
        content: `${datosStr}\n\n${respuestasStr}\n\nHISTORIAL DE ÚLTIMAS SEMANAS:\n${historialStr}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  let feedback: FeedbackIA;
  try {
    feedback = JSON.parse(cleaned) as FeedbackIA;
  } catch {
    feedback = {
      resumenEjecutivo: raw,
      funcionaBien: [],
      focoPrioritario: [],
      tareasRecomendadas: [],
      palancaClave: "",
      preguntaReflexion: "",
    };
  }

  // Upsert the review (by semana_inicio for this owner)
  await supabase
    .schema("personal")
    .from("weekly_reviews")
    .upsert(
      {
        owner_id: ownerId,
        semana_inicio: inicio,
        semana_fin: fin,
        datos_automaticos: datosAuto,
        respuestas_usuario: respuestasUsuario,
        feedback_ia: feedback,
        mrr_snapshot: datosAuto.clientes.mrr,
        clientes_activos_snapshot: datosAuto.clientes.activos,
        leads_activos_snapshot: datosAuto.leads.total,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "owner_id,semana_inicio" },
    );

  return Response.json({ feedback });
}
