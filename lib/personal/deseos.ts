export type DeseoPrioridad = "alta" | "media" | "baja";
export type DeseoEstado = "pendiente" | "comprado";

export const PRIORIDAD_LABEL: Record<DeseoPrioridad, string> = {
  alta:  "Alta",
  media: "Media",
  baja:  "Baja",
};

export const PRIORIDAD_LIST: DeseoPrioridad[] = ["alta", "media", "baja"];

// Reutiliza los tonos ya establecidos: --bad (rojo) y el dorado de marca.
export const PRIORIDAD_COLOR: Record<DeseoPrioridad, string> = {
  alta:  "#d9624a",
  media: "#C9A96E",
  baja:  "#8a8a8a",
};

export type DeseoCategoriaVM = {
  id: string;
  emoji: string | null;
  nombre: string;
};

export type DeseoVM = {
  id: string;
  nombre: string;
  categoriaId: string | null;
  precio: number | null;
  precioFinal: number | null;
  link: string | null;
  prioridad: DeseoPrioridad;
  estado: DeseoEstado;
  notas: string | null;
  imagenUrl: string | null;
  createdAt: string;
};
