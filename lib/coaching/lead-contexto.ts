export type ObjetivoLead = "definicion" | "volumen" | "recomposicion" | "salud";
export type ExperienciaLead = "ninguna" | "poca" | "intermedia" | "avanzada";

export const OBJETIVO_LIST: ObjetivoLead[] = ["definicion", "volumen", "recomposicion", "salud"];
export const OBJETIVO_LABEL: Record<ObjetivoLead, string> = {
  definicion:    "Definición",
  volumen:       "Volumen",
  recomposicion: "Recomposición",
  salud:         "Salud",
};

export const EXPERIENCIA_LIST: ExperienciaLead[] = ["ninguna", "poca", "intermedia", "avanzada"];
export const EXPERIENCIA_LABEL: Record<ExperienciaLead, string> = {
  ninguna:    "Ninguna",
  poca:       "Poca",
  intermedia: "Intermedia",
  avanzada:   "Avanzada",
};

export type DatosManualesLead = {
  nombre: string;
  edad: string;
  objetivo: ObjetivoLead | "";
  experiencia: ExperienciaLead | "";
  disponibilidad: string;
  obstaculo: string;
  tuvoCoach: boolean | null;
  motivacion: string;
  notasEconomicas: string;
  otros: string;
};

export const DATOS_MANUALES_VACIOS: DatosManualesLead = {
  nombre: "", edad: "", objetivo: "", experiencia: "", disponibilidad: "",
  obstaculo: "", tuvoCoach: null, motivacion: "", notasEconomicas: "", otros: "",
};

export type FaseScript = {
  titulo: string;
  contenido: string;
};

export type ObjecionRespuesta = {
  objecion: string;
  respuesta: string;
};

export type ScriptGenerado = {
  fases: FaseScript[];
  resumenFinal: {
    puntosDolor: string[];
    objeciones: ObjecionRespuesta[];
  };
};

export type LeadContextoVM = {
  id: string;
  leadId: string;
  respuestasCuestionario: string | null;
  datosManuales: DatosManualesLead | null;
  scriptGenerado: string | null; // JSON.stringify de ScriptGenerado
  scriptGeneradoAt: string | null;
};
