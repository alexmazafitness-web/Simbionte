import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { OBJETIVO_LABEL, EXPERIENCIA_LABEL, type DatosManualesLead } from "@/lib/coaching/lead-contexto";

function stripMarkdown(text: string): string {
  return text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

function formatDatosManuales(d: DatosManualesLead): string {
  return `• Nombre y edad: ${d.nombre || "?"}, ${d.edad || "?"} años
• Objetivo principal: ${d.objetivo ? OBJETIVO_LABEL[d.objetivo] : "no especificado"}
• Experiencia entrenando: ${d.experiencia ? EXPERIENCIA_LABEL[d.experiencia] : "no especificada"}
• Disponibilidad semanal para entrenar: ${d.disponibilidad || "no especificada"}
• Principal obstáculo hasta ahora: ${d.obstaculo || "no especificado"}
• ¿Ha tenido coach antes?: ${d.tuvoCoach === null ? "no especificado" : d.tuvoCoach ? "Sí" : "No"}
• Motivación principal: ${d.motivacion || "no especificada"}
• Situación económica percibida (notas, nunca preguntada directamente): ${d.notasEconomicas || "sin notas"}
• Otra información relevante: ${d.otros || "ninguna"}`;
}

export async function POST(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  const body = await req.json() as {
    respuestasCuestionario?: string;
    datosManuales?: DatosManualesLead;
  };

  const datosLeadStr = body.respuestasCuestionario?.trim()
    ? `RESPUESTAS DEL CUESTIONARIO (pegadas tal cual por el lead):\n${body.respuestasCuestionario.trim()}`
    : body.datosManuales
      ? `DATOS RECOGIDOS MANUALMENTE POR EL COACH:\n${formatDatosManuales(body.datosManuales)}`
      : null;

  if (!datosLeadStr) {
    return Response.json({ error: "No hay cuestionario ni datos manuales para este lead" }, { status: 400 });
  }

  const systemPrompt = `Eres un experto en ventas consultivas para coaching de fitness online. Trabajas para Alex, coach online de fitness y nutrición que ofrece una asesoría integral (entrenamiento + nutrición + seguimiento personalizado), con estas tarifas:
- 115€/mes (mensual)
- 300€/trimestre (trimestral)
- 570€/semestre (semestral)
- 1080€/año (anual)

Tu tarea: generar un script de llamada de ventas COMPLETO y PERSONALIZADO para un lead concreto, siguiendo estas 9 fases:
1. Apertura y rapport
2. Transición a preguntas
3. Situación actual
4. Problema y consecuencias
5. Solución ideal
6. Presentación de la solución
7. Manejo de objeciones
8. Cierre
9. Seguimiento

INSTRUCCIONES:
- Para cada fase escribe EXACTAMENTE qué decir, en primera persona, como si fueras Alex hablando en la llamada — nunca instrucciones sobre qué hacer, sino las palabras reales que diría.
- Personaliza cada fase con los datos concretos del lead: si mencionó un obstáculo concreto (p. ej. la constancia), las fases de "Problema y consecuencias" y "Solución ideal" deben nombrarlo explícitamente y conectar la solución (el seguimiento semanal) con ESE obstáculo, no con generalidades.
- Marca las frases clave que debe decir tal cual envolviéndolas en **doble asterisco** — se resaltan visualmente en la interfaz.
- Tono: cercano, directo, sin presión. El objetivo de la llamada es entender y ayudar, nunca vender a toda costa.
- Al final, un resumen con los puntos de dolor clave del lead y, para cada objeción probable (precio, tiempo, "lo voy a pensar", experiencias previas fallidas, etc.), cómo rebatirla basándote en SUS datos concretos — no objeciones ni respuestas genéricas.

FORMATO DE RESPUESTA — responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra:
{
  "fases": [
    { "titulo": "1. Apertura y rapport", "contenido": "..." },
    { "titulo": "2. Transición a preguntas", "contenido": "..." },
    { "titulo": "3. Situación actual", "contenido": "..." },
    { "titulo": "4. Problema y consecuencias", "contenido": "..." },
    { "titulo": "5. Solución ideal", "contenido": "..." },
    { "titulo": "6. Presentación de la solución", "contenido": "..." },
    { "titulo": "7. Manejo de objeciones", "contenido": "..." },
    { "titulo": "8. Cierre", "contenido": "..." },
    { "titulo": "9. Seguimiento", "contenido": "..." }
  ],
  "resumenFinal": {
    "puntosDolor": ["...", "..."],
    "objeciones": [{ "objecion": "...", "respuesta": "..." }]
  }
}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const response = await anthropic.messages.create({
    model:      "claude-sonnet-4-6",
    max_tokens: 4096,
    system:     systemPrompt,
    messages:   [{ role: "user", content: datosLeadStr }],
  });

  const raw = response.content[0].type === "text" ? response.content[0].text : "{}";
  const cleaned = stripMarkdown(raw);

  try {
    const parsed = JSON.parse(cleaned);
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "La IA no devolvió JSON válido", raw: cleaned }, { status: 500 });
  }
}
