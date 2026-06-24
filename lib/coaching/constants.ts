export const GRUPOS_CODIGOS = ["S1", "S2", "D1", "D2"] as const;

// Offset en días aplicado a la próxima revisión al crear/reactivar un cliente,
// según el grupo de revisión asignado (igual que en la referencia).
export const GRUPO_REV_DEFAULT: Record<string, number> = {
  S1: 4,
  S2: 11,
  D1: 4,
  D2: -3,
};

export const RECURRENCIAS = ["Mensual", "Trimestral", "Semestral", "Anual"] as const;
export type Recurrencia = (typeof RECURRENCIAS)[number];

export const CICLO_DIAS: Record<Recurrencia, number> = {
  Mensual: 30,
  Trimestral: 90,
  Semestral: 180,
  Anual: 365,
};

export const MESES_CICLO: Record<Recurrencia, number> = {
  Mensual: 1,
  Trimestral: 3,
  Semestral: 6,
  Anual: 12,
};

export const CATEGORIAS = ["meso", "nutricion", "seguimiento", "otros"] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  meso: "Mesociclo",
  nutricion: "Nutrición",
  seguimiento: "Seguimiento",
  otros: "Otros",
};

export const ETAPAS = ["nuevo", "audio", "llamada_agendada", "llamada_hecha"] as const;
export type Etapa = (typeof ETAPAS)[number] | "cliente" | "descartado";

export const ETAPA_LABEL: Record<(typeof ETAPAS)[number], string> = {
  nuevo: "Nuevo contacto",
  audio: "Audio enviado",
  llamada_agendada: "Llamada agendada",
  llamada_hecha: "Llamada hecha",
};

export const ETAPA_SIGUIENTE: Record<(typeof ETAPAS)[number], (typeof ETAPAS)[number] | null> = {
  nuevo: "audio",
  audio: "llamada_agendada",
  llamada_agendada: "llamada_hecha",
  llamada_hecha: null,
};

export const OBJETIVO_MRR = 2000;
