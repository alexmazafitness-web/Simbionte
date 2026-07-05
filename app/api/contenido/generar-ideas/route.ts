import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { listKnNotes } from "@/lib/personal/knowledge-queries";

function stripMarkdown(text: string): string {
  return text.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
}

export async function POST() {
  const supabase = await createClient();
  await requireUserId(supabase);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }

  // ── Recopilar contexto real (notas de clientes + Knowledge) ─────────────────
  const [notasRes, knNotesRes] = await Promise.allSettled([
    supabase
      .schema("coaching")
      .from("notas_cliente")
      .select("nota, categoria, fecha, clientes ( nombre )")
      .order("fecha", { ascending: false })
      .limit(20),
    listKnNotes(),
  ]);

  const notasCliente = notasRes.status === "fulfilled" ? (notasRes.value.data ?? []) : [];
  const notasKnowledge = knNotesRes.status === "fulfilled" ? knNotesRes.value.slice(0, 15) : [];

  const notasClienteStr = notasCliente.length === 0
    ? "Ninguna"
    : notasCliente.map((n: { nota: string; categoria: string; clientes: unknown }) => {
        const nombre = (n.clientes as { nombre: string } | null)?.nombre ?? "cliente";
        return `• [${nombre} · ${n.categoria}] ${n.nota}`;
      }).join("\n");

  const knowledgeStr = notasKnowledge.length === 0
    ? "Ninguna"
    : notasKnowledge.map((k) => `• ${k.title}${k.text ? ` — ${k.text.slice(0, 200)}` : ""}`).join("\n");

  // ── Prompt ────────────────────────────────────────────────────────────────────

  const systemPrompt = `Eres un estratega de contenido para Instagram especializado en fitness. Trabajas para un coach online de fitness y nutrición, especializado en recomposición corporal para hombres de 20 a 35 años.

Tu tarea: proponer 5 ideas de contenido NUEVAS, concretas y basadas en el trabajo real del coach — nunca genéricas — a partir de las notas de revisiones de clientes y del conocimiento (Knowledge) que se te proporcionan a continuación.

INSTRUCCIONES:
1. Cada idea debe conectar con algo real: un patrón que se repite en varios clientes, una duda frecuente en las revisiones, un aprendizaje reciente de Knowledge, o una situación concreta de seguimiento.
2. Varía el formato entre las 5 ideas (no repitas el mismo dos veces si es posible).
3. El título debe ser accionable y concreto — nunca "Habla de proteína", sino algo como "Por qué tus clientes dejan de progresar en la semana 6 (y qué cambiar)".
4. La descripción explica en 1-2 frases el ángulo concreto y por qué es relevante ahora mismo.
5. Asigna la fuente más honesta: 'revision_cliente' si nace de una nota de cliente, 'estudio' si nace de Knowledge, 'otro' si es una síntesis de ambas fuentes.

FORMATO DE RESPUESTA — responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra:
{
  "ideas": [
    { "titulo": "...", "descripcion": "...", "fuente": "revision_cliente|podcast|gym|estudio|otro", "formato": "reel_camara|reel_texto_voz|carrusel|story" }
  ]
}`;

  const userPrompt = `NOTAS DE REVISIONES DE CLIENTES RECIENTES (${notasCliente.length}):
${notasClienteStr}

CONOCIMIENTO RECIENTE (Knowledge, ${notasKnowledge.length}):
${knowledgeStr}`;

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
    const parsed = JSON.parse(cleaned) as {
      ideas: { titulo: string; descripcion: string; fuente: string; formato: string }[];
    };
    return Response.json(parsed);
  } catch {
    return Response.json({ error: "La IA no devolvió JSON válido", raw: cleaned }, { status: 500 });
  }
}
