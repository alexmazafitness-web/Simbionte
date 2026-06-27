import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);

  const body = await req.json() as {
    notaBruta: string;
    fuenteTipo: string;
    fuenteNombre: string;
    categorias: Array<{ id: string; name: string }>;
  };

  const { notaBruta, fuenteTipo, fuenteNombre, categorias } = body;
  const categoriasStr = categorias.length
    ? categorias.map((c) => `- ${c.name} (id: ${c.id})`).join("\n")
    : "(sin categorías disponibles)";

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: `Eres un asistente que procesa y estructura conocimiento personal. Transforma la nota bruta del usuario en conocimiento claro y accionable.

INSTRUCCIONES:
1. Crea un título descriptivo y conciso (máximo 10 palabras).
2. Redacta el contenido de forma clara y bien estructurada (2-4 párrafos, prosa continua, sin listas dentro del contenido).
3. Extrae 3-5 puntos clave como frases breves y memorables.
4. Elige la categoría más adecuada de la lista. Si ninguna encaja, devuelve null.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra:
{
  "titulo": "...",
  "contenido": "...",
  "puntosClave": ["...", "...", "..."],
  "categoriaId": "..."
}`,
    messages: [
      {
        role: "user",
        content: `Nota bruta: ${notaBruta}

Fuente: ${fuenteTipo}${fuenteNombre ? ` — ${fuenteNombre}` : ""}

Categorías disponibles:
${categoriasStr}`,
      },
    ],
  });

  const raw = message.content[0].type === "text" ? message.content[0].text.trim() : "";

  // Strip markdown code fences if the model wraps in ```json
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
      titulo: "Nota procesada",
      contenido: raw,
      puntosClave: [],
      categoriaId: null,
    });
  }
}
