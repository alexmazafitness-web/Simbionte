import type { EstadoPieza, TipoPieza } from "./contenido-constants";

export type PiezaVM = {
  id: string;
  titulo: string;
  tipo: TipoPieza | null;
  estado: EstadoPieza;
  fechaPublicacion: string | null;
  url: string | null;
};

export type ChecklistEstadoVM = Record<string, boolean>;
