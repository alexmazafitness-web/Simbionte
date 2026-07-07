export type OnboardingFase = "D0" | "D3" | "S1" | "MES1";

export const FASE_LABEL: Record<OnboardingFase, string> = {
  D0:   "D0 — Bienvenida",
  D3:   "D3 — Contacto de control",
  S1:   "S1 — Seguimiento preventivo",
  MES1: "Mes 1 — Recap",
};

// Mismos tonos que FRONT_COLOR (constants.ts) para mantener la paleta única
// del proyecto: D0 dorado, D3 azul, S1 verde, MES1 morado.
export const FASE_COLOR: Record<OnboardingFase, string> = {
  D0:   "#C9A96E",
  D3:   "#6BA3E0",
  S1:   "#5DCAA5",
  MES1: "#A78BDB",
};

export type PasoTemplate = {
  fase:       OnboardingFase;
  dia_offset: number;
  titulo:     string;
  orden:      number;
};

// Fuente única de verdad para "qué pasos tiene el onboarding": se usa tanto
// para sembrar el seguimiento real de cada cliente nuevo (initOnboarding)
// como para la guía de referencia general (GuiaPasos.tsx).
export const ONBOARDING_PASOS: PasoTemplate[] = [
  { fase: "D0",   dia_offset: 0,  titulo: "Dar acceso a carpeta INFO INICIAL en Drive", orden: 0  },
  { fase: "D0",   dia_offset: 0,  titulo: "Enviar mensaje de bienvenida",               orden: 1  },
  { fase: "D0",   dia_offset: 0,  titulo: "Enviar vídeo explicativo",                   orden: 2  },
  { fase: "D0",   dia_offset: 0,  titulo: "Recibir cuestionario completado",            orden: 3  },
  { fase: "D0",   dia_offset: 0,  titulo: "Recibir condiciones firmadas",               orden: 4  },
  { fase: "D0",   dia_offset: 0,  titulo: "Preparar plan de entrenamiento",             orden: 5  },
  { fase: "D0",   dia_offset: 0,  titulo: "Preparar planificación nutricional",         orden: 6  },
  { fase: "D0",   dia_offset: 0,  titulo: "Entregar plan",                              orden: 7  },
  { fase: "D3",   dia_offset: 3,  titulo: "Enviar mensaje de seguimiento",                          orden: 8  },
  { fase: "D3",   dia_offset: 3,  titulo: "Confirmar que ha visto el vídeo y completado la carpeta", orden: 9  },
  { fase: "D3",   dia_offset: 3,  titulo: "Resolver dudas si las hay",                              orden: 10 },
  { fase: "S1",   dia_offset: 7,  titulo: "Enviar mensaje S1",                       orden: 11 },
  { fase: "S1",   dia_offset: 7,  titulo: "Revisar adherencia primera semana",       orden: 12 },
  { fase: "S1",   dia_offset: 7,  titulo: "Ajustes iniciales si es necesario",       orden: 13 },
  { fase: "MES1", dia_offset: 30, titulo: "Enviar mensaje Mes 1",                    orden: 14 },
  { fase: "MES1", dia_offset: 30, titulo: "Valorar resultados primer mes",          orden: 15 },
  { fase: "MES1", dia_offset: 30, titulo: "Ajustes para el siguiente mes",          orden: 16 },
];

// Label used in reminder titles, keyed by fase
export const FASE_REMINDER_LABEL: Partial<Record<OnboardingFase, string>> = {
  D3:   "Control D3",
  S1:   "Seguimiento S1",
  MES1: "Recap Mes 1",
};
