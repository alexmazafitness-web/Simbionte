// Bridge function: crosses personal.* and coaching.* schemas intentionally.
// This is the only place where both schemas are queried together.
import { createClient } from "@/lib/supabase/server";
import { MESES_CICLO, type Recurrencia } from "@/lib/coaching/constants";
import {
  getWeekBounds,
  type DatosAutomaticos,
  type HistorialItem,
  type RespuestasUsuario,
  type WeeklyReviewVM,
  RESPUESTAS_VACIAS,
  type FeedbackIA,
} from "./revision";

export async function getDatosRevisionSemanal(): Promise<DatosAutomaticos> {
  const supabase = await createClient();
  const { inicio, fin } = getWeekBounds();
  const inicioTs = `${inicio}T00:00:00`;
  const finTs = `${fin}T23:59:59`;

  const [
    tareasCompletadas,
    tareasCreadas,
    tareasPendientes,
    clientesAll,
    suscripcionesActivas,
    leadsAll,
    leadsNuevos,
    revisionesClientes,
    notasKnowledge,
  ] = await Promise.all([
    // Tareas completadas esta semana
    supabase
      .schema("personal")
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("done", true)
      .gte("done_at", inicioTs)
      .lte("done_at", finTs),

    // Tareas creadas esta semana
    supabase
      .schema("personal")
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", inicioTs)
      .lte("created_at", finTs),

    // Tareas pendientes totales
    supabase
      .schema("personal")
      .from("tasks")
      .select("id", { count: "exact", head: true })
      .eq("done", false),

    // Clientes: activos, nuevos esta semana, bajas esta semana
    supabase
      .schema("coaching")
      .from("clientes")
      .select("id, estado, fecha_inicio, baja_fecha")
      .neq("estado", "eliminado"),

    // Suscripciones activas para MRR + vencen esta semana
    supabase
      .schema("coaching")
      .from("suscripciones")
      .select("precio, recurrencia, proximo_pago")
      .eq("estado", "activa"),

    // Leads total + por etapa
    supabase
      .schema("coaching")
      .from("leads")
      .select("id, estado")
      .neq("estado", "descartado"),

    // Leads nuevos esta semana
    supabase
      .schema("coaching")
      .from("leads")
      .select("id", { count: "exact", head: true })
      .gte("created_at", inicioTs)
      .lte("created_at", finTs),

    // Revisiones de clientes esta semana
    supabase
      .schema("coaching")
      .from("revisiones")
      .select("id", { count: "exact", head: true })
      .gte("fecha", inicio)
      .lte("fecha", fin),

    // Notas de Knowledge creadas esta semana
    supabase
      .schema("personal")
      .from("kn_notes")
      .select("id", { count: "exact", head: true })
      .gte("created_at", inicioTs)
      .lte("created_at", finTs),
  ]);

  const clientes = (clientesAll.data ?? []) as { estado: string; fecha_inicio: string | null; baja_fecha: string | null }[];
  const activos = clientes.filter((c) => c.estado === "activo").length;
  const nuevosSemana = clientes.filter(
    (c) => c.fecha_inicio && c.fecha_inicio >= inicio && c.fecha_inicio <= fin,
  ).length;
  const bajasSemana = clientes.filter(
    (c) => c.baja_fecha && c.baja_fecha >= inicio && c.baja_fecha <= fin,
  ).length;

  const suscripciones = (suscripcionesActivas.data ?? []) as {
    precio: number;
    recurrencia: Recurrencia;
    proximo_pago: string | null;
  }[];
  const mrr = Math.round(
    suscripciones.reduce((s, sub) => {
      const meses = MESES_CICLO[sub.recurrencia] ?? 1;
      return s + sub.precio / meses;
    }, 0),
  );
  const vencenSemana = suscripciones.filter(
    (s) => s.proximo_pago && s.proximo_pago >= inicio && s.proximo_pago <= fin,
  ).length;

  const leads = (leadsAll.data ?? []) as { estado: string }[];
  const porEtapa: Record<string, number> = {};
  for (const l of leads) {
    porEtapa[l.estado] = (porEtapa[l.estado] ?? 0) + 1;
  }

  return {
    tareas: {
      completadasSemana: tareasCompletadas.count ?? 0,
      creadasSemana: tareasCreadas.count ?? 0,
      pendientesTotales: tareasPendientes.count ?? 0,
    },
    clientes: {
      activos,
      nuevosSemana,
      bajasSemana,
      mrr,
    },
    leads: {
      total: leads.length,
      nuevosSemana: leadsNuevos.count ?? 0,
      porEtapa,
    },
    suscripcionesVencenSemana: vencenSemana,
    revisionesClientes: revisionesClientes.count ?? 0,
    notasKnowledge: notasKnowledge.count ?? 0,
  };
}

export async function getRevisionActual(): Promise<WeeklyReviewVM | null> {
  const supabase = await createClient();
  const { inicio } = getWeekBounds();
  const { data, error } = await supabase
    .schema("personal")
    .from("weekly_reviews")
    .select("*")
    .eq("semana_inicio", inicio)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return shapeReview(data);
}

export async function getHistorialRevisiones(limit = 6): Promise<HistorialItem[]> {
  const supabase = await createClient();
  const { inicio } = getWeekBounds();
  const { data, error } = await supabase
    .schema("personal")
    .from("weekly_reviews")
    .select("id, semana_inicio, semana_fin, mrr_snapshot, clientes_activos_snapshot, leads_activos_snapshot, feedback_ia")
    .lt("semana_inicio", inicio)
    .order("semana_inicio", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row) => {
    const fb = row.feedback_ia as { resumenEjecutivo?: string } | null;
    return {
      id: row.id,
      semanaInicio: row.semana_inicio,
      semanaFin: row.semana_fin,
      mrrSnapshot: row.mrr_snapshot,
      clientesActivosSnapshot: row.clientes_activos_snapshot,
      leadsActivosSnapshot: row.leads_activos_snapshot,
      resumen: fb?.resumenEjecutivo
        ? fb.resumenEjecutivo.split(".")[0].slice(0, 90)
        : null,
    };
  });
}

// Used by API route to fetch last N reviews for Claude context
export async function getUltimasRevisiones(n: number): Promise<WeeklyReviewVM[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .schema("personal")
    .from("weekly_reviews")
    .select("*")
    .not("feedback_ia", "is", null)
    .order("semana_inicio", { ascending: false })
    .limit(n);
  if (error) throw error;
  return (data ?? []).map(shapeReview);
}

function shapeReview(row: Record<string, unknown>): WeeklyReviewVM {
  return {
    id: row.id as string,
    semanaInicio: row.semana_inicio as string,
    semanaFin: row.semana_fin as string,
    datosAutomaticos: (row.datos_automaticos as DatosAutomaticos) ?? {},
    respuestasUsuario: {
      ...RESPUESTAS_VACIAS,
      ...((row.respuestas_usuario as Partial<RespuestasUsuario>) ?? {}),
    },
    feedbackIA: (row.feedback_ia as FeedbackIA | null) ?? null,
    mrrSnapshot: (row.mrr_snapshot as number) ?? 0,
    clientesActivosSnapshot: (row.clientes_activos_snapshot as number) ?? 0,
    leadsActivosSnapshot: (row.leads_activos_snapshot as number) ?? 0,
    createdAt: row.created_at as string,
  };
}
