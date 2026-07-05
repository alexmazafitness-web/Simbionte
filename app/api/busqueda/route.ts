import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import { ETAPA_LABEL } from "@/lib/coaching/constants";
import { FRONT_LABEL, type Front } from "@/lib/personal/constants";
import { fmtDateCorta } from "@/lib/personal/format";

type Resultado = {
  id: string;
  titulo: string;
  subtitulo: string;
  href: string;
  // Timestamptz (instante, no fecha de calendario) — se formatea en el
  // cliente, nunca en el servidor: el servidor (Vercel) corre en UTC y
  // convertir aquí desfasaría el día para el usuario cerca de medianoche.
  remindAtISO?: string;
};

const LIMIT = 4;

// PostgREST .or() rompe su gramática de filtros con "," y "(" en el valor —
// se sanean solo para esa consulta (el resto usa .ilike() plano, sin riesgo).
function paraOr(q: string): string {
  return q.replace(/[,()]/g, " ");
}

export async function GET(req: Request) {
  const supabase = await createClient();
  await requireUserId(supabase);

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("q") ?? "").trim();

  const vacio = { clientes: [], tareas: [], knowledge: [], ideas: [], leads: [], recordatorios: [] };
  if (!q) return Response.json(vacio);

  const like = `%${q}%`;
  const likeOr = `%${paraOr(q)}%`;

  const [clientesRes, tareasRes, knowledgeRes, ideasRes, leadsRes, recordatoriosRes] = await Promise.allSettled([
    supabase.schema("coaching").from("clientes")
      .select("id, nombre, estado, suscripciones ( precio, estado )")
      .ilike("nombre", like)
      .limit(LIMIT),
    supabase.schema("personal").from("tasks")
      .select("id, title, due_date")
      .ilike("title", like)
      .limit(LIMIT),
    supabase.schema("personal").from("kn_notes")
      .select("id, title, content, kn_categories ( name )")
      .or(`title.ilike.${likeOr},content.ilike.${likeOr}`)
      .limit(LIMIT),
    supabase.schema("personal").from("ideas")
      .select("id, title, front")
      .ilike("title", like)
      .limit(LIMIT),
    supabase.schema("coaching").from("leads")
      .select("id, nombre, estado")
      .ilike("nombre", like)
      .limit(LIMIT),
    supabase.schema("personal").from("reminders")
      .select("id, title, remind_at")
      .ilike("title", like)
      .limit(LIMIT),
  ]);

  const clientes: Resultado[] = clientesRes.status === "fulfilled"
    ? (clientesRes.value.data ?? []).map((c: { id: string; nombre: string; estado: string; suscripciones: unknown }) => {
        const activa = (c.suscripciones as { precio: number; estado: string }[] | null)?.find((s) => s.estado === "activa");
        return {
          id:        c.id,
          titulo:    c.nombre,
          subtitulo: `${c.estado === "activo" ? "Activo" : "Baja"}${activa ? ` · ${Math.round(activa.precio)}€` : ""}`,
          href:      `/coaching/clientes?clienteId=${c.id}`,
        };
      })
    : [];

  const tareas: Resultado[] = tareasRes.status === "fulfilled"
    ? (tareasRes.value.data ?? []).map((t: { id: string; title: string; due_date: string | null }) => ({
        id:        t.id,
        titulo:    t.title,
        subtitulo: t.due_date ? fmtDateCorta(t.due_date) : "Sin fecha",
        href:      "/personal/cerebro/tareas",
      }))
    : [];

  const knowledge: Resultado[] = knowledgeRes.status === "fulfilled"
    ? (knowledgeRes.value.data ?? []).map((k: { id: string; title: string; content: string | null; kn_categories: unknown }) => {
        const cat = (k.kn_categories as { name: string } | null)?.name;
        const fragmento = k.content ? k.content.slice(0, 70).trim() + (k.content.length > 70 ? "…" : "") : "";
        return {
          id:        k.id,
          titulo:    k.title,
          subtitulo: [cat, fragmento].filter(Boolean).join(" · "),
          href:      `/personal/cerebro/knowledge?nota=${k.id}`,
        };
      })
    : [];

  const ideas: Resultado[] = ideasRes.status === "fulfilled"
    ? (ideasRes.value.data ?? []).map((i: { id: string; title: string; front: string }) => ({
        id:        i.id,
        titulo:    i.title.length > 70 ? i.title.slice(0, 70).trim() + "…" : i.title,
        subtitulo: FRONT_LABEL[i.front as Front] ?? i.front,
        href:      "/personal/cerebro/ideas",
      }))
    : [];

  const leads: Resultado[] = leadsRes.status === "fulfilled"
    ? (leadsRes.value.data ?? []).map((l: { id: string; nombre: string; estado: string }) => ({
        id:        l.id,
        titulo:    l.nombre,
        subtitulo: (ETAPA_LABEL as Record<string, string>)[l.estado] ?? (l.estado === "cliente" ? "Convertido a cliente" : "Descartado"),
        href:      "/coaching/leads",
      }))
    : [];

  const recordatorios: Resultado[] = recordatoriosRes.status === "fulfilled"
    ? (recordatoriosRes.value.data ?? []).map((r: { id: string; title: string; remind_at: string }) => ({
        id:          r.id,
        titulo:      r.title,
        subtitulo:   "",
        href:        "/personal/cerebro/recordatorios",
        remindAtISO: r.remind_at,
      }))
    : [];

  return Response.json({ clientes, tareas, knowledge, ideas, leads, recordatorios });
}
