export type OnboardingFase = "D0" | "D3" | "S1" | "MES1";

export const FASE_LABEL: Record<OnboardingFase, string> = {
  D0:   "Día 0 — Bienvenida",
  D3:   "Día 3 — Control",
  S1:   "Semana 1 — Seguimiento",
  MES1: "Mes 1 — Recap",
};

export type PasoTemplate = {
  fase:       OnboardingFase;
  dia_offset: number;
  titulo:     string;
  orden:      number;
};

export const ONBOARDING_PASOS: PasoTemplate[] = [
  { fase: "D0",   dia_offset: 0,  titulo: "Enviar mensaje de bienvenida (WhatsApp)",             orden: 0  },
  { fase: "D0",   dia_offset: 0,  titulo: "Enviar PDF condiciones + protección de datos",        orden: 1  },
  { fase: "D0",   dia_offset: 0,  titulo: "Recibir condiciones firmadas",                        orden: 2  },
  { fase: "D0",   dia_offset: 0,  titulo: "Enviar cuestionario inicial",                         orden: 3  },
  { fase: "D0",   dia_offset: 0,  titulo: "Recibir cuestionario completado",                     orden: 4  },
  { fase: "D0",   dia_offset: 0,  titulo: "Enviar vídeos explicativos (MESO, NUTRI, SEGUIMIENTO)", orden: 5 },
  { fase: "D0",   dia_offset: 0,  titulo: "Entregar plan de entrenamiento inicial",               orden: 6  },
  { fase: "D0",   dia_offset: 0,  titulo: "Entregar planificación nutricional inicial",           orden: 7  },
  { fase: "D3",   dia_offset: 3,  titulo: "Contactar para verificar inicio y dudas iniciales",   orden: 8  },
  { fase: "S1",   dia_offset: 7,  titulo: "Seguimiento preventivo: primera semana y adherencia", orden: 9  },
  { fase: "MES1", dia_offset: 30, titulo: "Recap del primer mes: resultados, sensaciones y ajustes", orden: 10 },
];

// Label used in reminder titles, keyed by fase
export const FASE_REMINDER_LABEL: Partial<Record<OnboardingFase, string>> = {
  D3:   "Control D3",
  S1:   "Seguimiento S1",
  MES1: "Recap Mes 1",
};
