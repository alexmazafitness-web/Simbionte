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
    notaBruta: string;
    fuenteTipo: string;
    fuenteNombre: string;
    categorias: Array<{ id: string; name: string }>;
    textoLargo?: boolean;
  };

  const { notaBruta, fuenteTipo, fuenteNombre, categorias, textoLargo } = body;
  const isLarga = textoLargo === true || notaBruta.length > 2000;

  const categoriasStr = categorias.length
    ? categorias.map((c) => `- ${c.name} (id: ${c.id})`).join("\n")
    : "(sin categorías disponibles)";

  const systemPrompt = isLarga
    ? `Eres un experto en síntesis y extracción de conocimiento. Tu tarea es procesar un texto largo (transcripción, artículo, apuntes) y destilar ÚNICAMENTE el conocimiento valioso y accionable.

NO copies el texto original. Solo extrae y estructura el conocimiento.

INSTRUCCIONES:
1. Crea un título descriptivo y conciso (máximo 12 palabras).
2. Estructura el conocimiento extraído en secciones con cabecera markdown (## Sección).
   - Cada sección = un tema, concepto o aprendizaje central
   - Máximo 5-6 secciones, cada una con 2-3 párrafos densos
   - Solo conocimiento valioso: ideas clave, conceptos, frameworks, aprendizajes
   - Prosa clara y directa, sin listas dentro de las secciones
3. Extrae entre 5 y 15 puntos clave: frases cortas, concretas y memorables.
4. Elige la categoría más adecuada de la lista. Si ninguna encaja, devuelve null.

FORMATO DE RESPUESTA: Responde ÚNICAMENTE con JSON válido, sin bloques markdown, sin texto extra:
{
  "titulo": "...",
  "contenido": "## Sección 1\\n\\n...\\n\\n## Sección 2\\n\\n...",
  "puntosClave": ["...", "...", "..."],
  "categoriaId": "..."
}`
    : `Eres un asistente que procesa y estructura conocimiento personal. Transforma la nota bruta del usuario en conocimiento claro y accionable.

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
}`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: isLarga ? 4096 : 1024,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: `${isLarga ? "Texto a procesar" : "Nota bruta"}: ${notaBruta}

Fuente: ${fuenteTipo}${fuenteNombre ? ` — ${fuenteNombre}` : ""}

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
      titulo: "Nota procesada",
      contenido: raw,
      puntosClave: [],
      categoriaId: null,
    });
  }
}
