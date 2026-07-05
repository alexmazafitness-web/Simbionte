export type ContenidoFuente = "revision_cliente" | "podcast" | "gym" | "estudio" | "otro";
export type ContenidoFormato = "reel_camara" | "reel_texto_voz" | "carrusel" | "story";
export type ContenidoEstado =
  | "idea" | "seleccionada" | "en_produccion" | "grabado" | "editado" | "publicado" | "descartado";

export const FUENTE_LIST: ContenidoFuente[] = ["revision_cliente", "podcast", "gym", "estudio", "otro"];
export const FUENTE_LABEL: Record<ContenidoFuente, string> = {
  revision_cliente: "Revisión cliente",
  podcast:          "Podcast",
  gym:              "Gimnasio",
  estudio:          "Estudio",
  otro:             "Otro",
};

export const FORMATO_LIST: ContenidoFormato[] = ["reel_camara", "reel_texto_voz", "carrusel", "story"];
export const FORMATO_LABEL: Record<ContenidoFormato, string> = {
  reel_camara:    "Reel a cámara",
  reel_texto_voz: "Reel texto + voz",
  carrusel:       "Carrusel",
  story:          "Story",
};

export const ESTADO_LABEL: Record<ContenidoEstado, string> = {
  idea:          "Idea",
  seleccionada:  "Seleccionada",
  en_produccion: "En producción",
  grabado:       "Grabado",
  editado:       "Editado",
  publicado:     "Publicado",
  descartado:    "Descartado",
};

// Fondo oscuro por estado (cards del kanban) + acento para texto/chip sobre
// ese fondo. Reutiliza tonos de marca ya existentes donde encaja (editado=
// morado de "contenido" FRONT_COLOR, publicado=verde de "formacion",
// descartado=rojo de --bad).
export const ESTADO_BG: Record<ContenidoEstado, string> = {
  idea:          "#2a2a2a",
  seleccionada:  "#1e3a5f",
  en_produccion: "#2d1810",
  grabado:       "#2d2010",
  editado:       "#1e1b4b",
  publicado:     "#0a2414",
  descartado:    "#2d0f0f",
};

export const ESTADO_ACCENT: Record<ContenidoEstado, string> = {
  idea:          "#a3a3a3",
  seleccionada:  "#7FA8D9",
  en_produccion: "#E0925A",
  grabado:       "#D9C15A",
  editado:       "#A78BDB",
  publicado:     "#5DCAA5",
  descartado:    "#d9624a",
};

// Cadena de avance del kanban. "descartado" es un estado lateral (se llega
// por "Descartar", no por "Avanzar") y no tiene siguiente.
export const ESTADO_ORDEN: ContenidoEstado[] =
  ["idea", "seleccionada", "en_produccion", "grabado", "editado", "publicado"];

export function siguienteEstado(actual: ContenidoEstado): ContenidoEstado | null {
  const i = ESTADO_ORDEN.indexOf(actual);
  if (i === -1 || i === ESTADO_ORDEN.length - 1) return null;
  return ESTADO_ORDEN[i + 1]!;
}

export type ContenidoIdeaVM = {
  id: string;
  titulo: string;
  descripcion: string | null;
  fuente: ContenidoFuente | null;
  formato: ContenidoFormato | null;
  estado: ContenidoEstado;
  semanaAsignada: string | null;
  fechaPublicacion: string | null;
  urlPublicado: string | null;
  notas: string | null;
  createdAt: string;
};
