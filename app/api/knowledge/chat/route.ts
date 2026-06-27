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

  const { messages } = await req.json() as {
    messages: Array<{ role: "user" | "assistant"; content: string }>;
  };

  // Fetch all notes with category name
  const { data: notas } = await supabase
    .schema("personal")
    .from("kn_notes")
    .select("title, content, nota_bruta, fuente_tipo, fuente_nombre, puntos_clave, source, category_id")
    .order("created_at", { ascending: false });

  // Fetch categories to resolve names
  const { data: cats } = await supabase
    .schema("personal")
    .from("kn_categories")
    .select("id, name");

  const catMap = new Map((cats ?? []).map((c) => [c.id as string, c.name as string]));

  const notasStr = (notas ?? [])
    .map((n) => {
      const cat = n.category_id ? (catMap.get(n.category_id as string) ?? "Sin categoría") : "Sin categoría";
      const fuenteNombre = (n as any).fuente_nombre as string | null;
      const fuenteTipo = (n as any).fuente_tipo as string | null;
      const fuente = fuenteNombre
        ? `${fuenteTipo ?? ""}: ${fuenteNombre}`.trim()
        : (fuenteTipo ?? (n.source as string | null) ?? "—");
      const puntos = Array.isArray((n as any).puntos_clave) && (n as any).puntos_clave.length > 0
        ? `\nPuntos clave:\n${((n as any).puntos_clave as string[]).map((p) => `  • ${p}`).join("\n")}`
        : "";
      const contenido = (n.content as string | null) ?? (n as any).nota_bruta ?? "";
      return `## ${n.title as string}\nCategoría: ${cat} | Fuente: ${fuente}${puntos}\n${contenido}`;
    })
    .join("\n\n---\n\n");

  const systemPrompt =
    (notas ?? []).length > 0
      ? `Eres el asistente de conocimiento personal de Alex. SOLO puedes responder basándote en las notas que se te proporcionan. Nunca uses conocimiento externo.

Cuando respondas, cita siempre la nota concreta de la que extraes la información (incluye el título y la fuente si está disponible).

Si no encuentras información relevante en las notas, responde exactamente: "No tengo notas sobre esto en tu base de conocimiento."

BASE DE CONOCIMIENTO:
${notasStr}`
      : `La base de conocimiento de Alex está vacía. Dile que aún no hay notas guardadas y que puede añadir su primer aprendizaje con el botón "+ Nueva nota".`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return Response.json({ content: text });
}
