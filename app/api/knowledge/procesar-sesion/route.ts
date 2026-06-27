import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

export async function POST(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: "ANTHROPIC_API_KEY no configurada" }, { status: 500 });
  }
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const body = await req.json() as {
    notas: string[];
    fuenteTipo: string;
    fuenteNombre: string;
    categorias: Array<{ id: string; name: string }>;
    categoriaId?: string | null;
  };

  const { notas, fuenteTipo, fuenteNombre, categorias, categoriaId } = body;

  const categoriasStr = categorias.length
    ? categorias.map((c) => `- ${c.name} (id: ${c.id})`).join("\n")
    : "(sin categorías disponibles)";

  const notasStr = notas.map((n, i) => `[${i + 1}] ${n}`).join("\n\n");

  const catHint = categoriaId
    ? `\n\nEl usuario ha preseleccionado la categoría: ${categorias.find((c) => c.id === categoriaId)?.name ?? categoriaId}. Úsala si es adecuada.`
    : "";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: `Eres un experto en síntesis de conocimiento. El usuario ha capturado notas breves en tiempo real mientras consumía contenido (podcast, vídeo, libro, etc.). Tu tarea es integrar todos esos fragmentos en una nota cohesionada y valiosa.

INSTRUCCIONES:
1. Entiende las notas como fragmentos de una misma sesión de aprendizaje, no como ideas independientes.
2. Detecta los temas principales, las conexiones entre ideas y elimina redundancias.
3. Genera una nota estructurada en secciones markdown (## Sección):
   - Organiza las ideas por tema, no por el orden en que fueron capturadas
   - Máximo 4-5 secciones, prosa clara y densa
   - Sin listas dentro del contenido de las secciones
4. Extrae 5-10 puntos clave: frases cortas, concretas y memorables.
5. Crea un título que capture la esencia de toda la sesión (máximo 12 palabras).
6. Elige la categoría más adecuada de la lista disponible.${catHint}

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra:
{
  "titulo": "...",
  "contenido": "## Sección 1\\n\\n...\\n\\n## Sección 2\\n\\n...",
  "puntosClave": ["...", "...", "..."],
  "categoriaId": "..."
}`,
    messages: [
      {
        role: "user",
        content: `Fuente: ${fuenteTipo}${fuenteNombre ? ` — ${fuenteNombre}` : ""}

Notas capturadas durante la sesión:
${notasStr}

Categorías disponibles:
${categoriasStr}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const cleaned = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();

  try {
    const parsed = JSON.parse(cleaned) as {
      titulo: string;
      contenido: string;
      puntosClave: string[];
      categoriaId: string | null;
    };
    return Response.json(parsed);
  } catch {
    return Response.json({
      titulo: "Sesión procesada",
      contenido: raw,
      puntosClave: [],
      categoriaId: null,
    });
  }
}
