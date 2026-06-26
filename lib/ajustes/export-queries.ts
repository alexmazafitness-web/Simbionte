import { createClient } from "@/lib/supabase/server";

// Utilidad administrativa que cruza personal.* y coaching.* a propósito —
// no es un "puente" entre dos features, es un export completo de seguridad.
// La lista cubre todas las tablas existentes hasta la Fase 5.

const TABLAS_PERSONAL = [
  "tasks",
  "ideas",
  "reminders",
  "goal",
  "goal_history",
  "meta",
  "content",
  "events",
  "marked_dates",
  "kn_categories",
  "kn_notes",
  "kn_principles",
  "kn_systems",
  "infra",
  "fin_transactions",
  "fin_investments",
  "fin_crypto",
  "fin_debts",
  "fin_savings_goal",
] as const;

const TABLAS_COACHING = [
  "clientes",
  "suscripciones",
  "revisiones",
  "mesociclos",
  "notas_cliente",
  "leads",
  "llamadas",
  "contenido_ig",
  "contenido_checklist",
  "roadmap_items",
  "roadmap_subtasks",
  "grupos_revision",
  "tarifas",
] as const;

export type BackupCompleto = {
  exportedAt: string;
  personal: Record<(typeof TABLAS_PERSONAL)[number], unknown[]>;
  coaching: Record<(typeof TABLAS_COACHING)[number], unknown[]>;
};

async function leerTodas(supabase: Awaited<ReturnType<typeof createClient>>, schema: "personal" | "coaching", tablas: readonly string[]) {
  const resultados = await Promise.all(
    tablas.map(async (tabla) => {
      const { data, error } = await supabase.schema(schema).from(tabla).select("*");
      if (error) throw new Error(`${schema}.${tabla}: ${error.message}`);
      return [tabla, data] as const;
    }),
  );
  return Object.fromEntries(resultados);
}

// Si cualquier tabla falla, se lanza el error en vez de devolver un backup
// parcial en silencio — un backup de seguridad incompleto sin avisar es
// peor que un error claro que invite a reintentar.
export async function exportarTodosLosDatos(): Promise<BackupCompleto> {
  const supabase = await createClient();
  const [personal, coaching] = await Promise.all([
    leerTodas(supabase, "personal", TABLAS_PERSONAL),
    leerTodas(supabase, "coaching", TABLAS_COACHING),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    personal: personal as BackupCompleto["personal"],
    coaching: coaching as BackupCompleto["coaching"],
  };
}
