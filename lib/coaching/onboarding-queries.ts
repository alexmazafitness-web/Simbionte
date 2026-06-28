import { createClient } from "@/lib/supabase/server";
import { requireUserId } from "@/lib/supabase/auth";
import type { OnboardingFase } from "./onboarding-constants";

export type OnboardingPaso = {
  id:           string;
  fase:         OnboardingFase;
  dia_offset:   number;
  titulo:       string;
  completado:   boolean;
  completado_at: string | null;
  orden:        number;
};

export type OnboardingVM = {
  id:              string;
  clienteId:       string;
  clienteNombre:   string;
  fechaInicio:     string;
  estado:          "en_progreso" | "completado";
  completadoAt:    string | null;
  pasos:           OnboardingPaso[];
  totalPasos:      number;
  pasosCompletados: number;
  diasDesdeInicio: number;
};

export async function listOnboardings(
  estado: "en_progreso" | "completado" = "en_progreso",
): Promise<OnboardingVM[]> {
  const supabase = await createClient();
  await requireUserId(supabase);

  const { data, error } = await supabase
    .schema("coaching")
    .from("onboarding")
    .select(`
      id, cliente_id, fecha_inicio, estado, completado_at,
      clientes ( nombre ),
      onboarding_pasos ( id, fase, dia_offset, titulo, completado, completado_at, orden )
    `)
    .eq("estado", estado)
    .order("fecha_inicio", { ascending: true });

  if (error) throw error;

  const hoy = new Date();
  hoy.setHours(12, 0, 0, 0);

  return (data ?? []).map((row) => {
    const pasos = ((row.onboarding_pasos as OnboardingPaso[]) ?? []).sort(
      (a, b) => a.orden - b.orden,
    );
    const fechaInicio = new Date(row.fecha_inicio + "T12:00:00");
    const diasDesdeInicio = Math.floor(
      (hoy.getTime() - fechaInicio.getTime()) / 86_400_000,
    );

    return {
      id:               row.id,
      clienteId:        row.cliente_id,
      clienteNombre:    (row.clientes as unknown as { nombre: string }).nombre,
      fechaInicio:      row.fecha_inicio,
      estado:           row.estado as "en_progreso" | "completado",
      completadoAt:     row.completado_at,
      pasos,
      totalPasos:       pasos.length,
      pasosCompletados: pasos.filter((p) => p.completado).length,
      diasDesdeInicio,
    };
  });
}
