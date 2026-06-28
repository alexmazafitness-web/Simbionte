// Shared types for the daily planner assistant — imported by both server and client code.

export type HorarioConfig = {
  entre_semana: { inicio: string; horas: number };
  finde: { inicio: string; horas: number };
};

export const HORARIO_DEFAULT: HorarioConfig = {
  entre_semana: { inicio: "18:00", horas: 2 },
  finde:        { inicio: "09:00", horas: 5 },
};

export type FrentePlan = "Servicio" | "Contenido" | "Estudio" | "Personal";

export type BloquePlanActivo = {
  tipo?: never;
  hora_inicio: string;
  hora_fin: string;
  frente: FrentePlan;
  titulo: string;
  pasos: string[];
};

export type BloquePlanDescanso = {
  tipo: "descanso";
  hora_inicio: string;
  hora_fin: string;
};

export type BloquePlan = BloquePlanActivo | BloquePlanDescanso;

export type PlanIA = {
  bloques: BloquePlan[];
  pospuesto: string[];
};
