export type DatosAutomaticos = {
  tareas: {
    completadasSemana: number;
    creadasSemana: number;
    pendientesTotales: number;
  };
  clientes: {
    activos: number;
    nuevosSemana: number;
    bajasSemana: number;
    mrr: number;
  };
  leads: {
    total: number;
    nuevosSemana: number;
    porEtapa: Record<string, number>;
  };
  suscripcionesVencenSemana: number;
  revisionesClientes: number;
  notasKnowledge: number;
};

export type RespuestasUsuario = {
  energia: string;
  instagram: string;
  bloqueos: string;
  ventas: string;
  orgullo: string;
};

export const RESPUESTAS_VACIAS: RespuestasUsuario = {
  energia: "",
  instagram: "",
  bloqueos: "",
  ventas: "",
  orgullo: "",
};

export type FeedbackIA = {
  resumenEjecutivo: string;
  funcionaBien: string[];
  focoPrioritario: string[];
  tareasRecomendadas: string[];
  palancaClave: string;
  preguntaReflexion: string;
};

export type WeeklyReviewVM = {
  id: string;
  semanaInicio: string;
  semanaFin: string;
  datosAutomaticos: DatosAutomaticos;
  respuestasUsuario: RespuestasUsuario;
  feedbackIA: FeedbackIA | null;
  mrrSnapshot: number;
  clientesActivosSnapshot: number;
  leadsActivosSnapshot: number;
  createdAt: string;
};

export type HistorialItem = {
  id: string;
  semanaInicio: string;
  semanaFin: string;
  mrrSnapshot: number;
  clientesActivosSnapshot: number;
  leadsActivosSnapshot: number;
  resumen: string | null;
};

// Returns current ISO week bounds (Monday–Sunday) as YYYY-MM-DD strings.
export function getWeekBounds(): { inicio: string; fin: string } {
  const now = new Date();
  const day = now.getDay();
  const daysToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysToMonday);
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6);
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  return { inicio: fmt(monday), fin: fmt(sunday) };
}

export function fmtSemana(inicio: string, fin: string): string {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  const [yi, mi, di] = inicio.split("-").map(Number);
  const [, mf, df] = fin.split("-").map(Number);
  if (mi === mf) return `${di}–${df} ${months[mi - 1]} ${yi}`;
  return `${di} ${months[mi - 1]} – ${df} ${months[mf - 1]} ${yi}`;
}
