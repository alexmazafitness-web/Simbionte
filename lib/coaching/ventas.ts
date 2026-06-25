import type { FaseLlamadaId } from "./ventas-constants";

export type LlamadaVM = {
  id: string;
  leadId: string | null;
  leadNombre: string | null;
  fecha: string;
  faseAlcanzada: FaseLlamadaId | null;
  resultado: string | null;
  notas: string | null;
};
