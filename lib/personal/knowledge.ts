export type FuenteTipo =
  | "libro" | "podcast" | "video" | "articulo"
  | "estudio" | "blog" | "experiencia" | "otro";

export const FUENTE_LABELS: Record<FuenteTipo, string> = {
  libro:       "Libro",
  podcast:     "Podcast",
  video:       "Vídeo",
  articulo:    "Artículo",
  estudio:     "Estudio",
  blog:        "Blog",
  experiencia: "Experiencia propia",
  otro:        "Otro",
};

export const FUENTE_LIST: { value: FuenteTipo; label: string }[] = [
  { value: "libro",       label: "Libro" },
  { value: "podcast",     label: "Podcast" },
  { value: "video",       label: "Vídeo" },
  { value: "articulo",    label: "Artículo" },
  { value: "estudio",     label: "Estudio" },
  { value: "blog",        label: "Blog" },
  { value: "experiencia", label: "Experiencia propia" },
  { value: "otro",        label: "Otro" },
];

export type KnCategoryVM = {
  id: string;
  emoji: string | null;
  name: string;
};

export type FuenteLongitud = "corta" | "larga" | "sesion";

export type KnNoteVM = {
  id: string;
  title: string;
  text: string | null;
  notaBruta: string | null;
  fuenteTipo: FuenteTipo | null;
  fuenteNombre: string;
  fuenteLongitud: FuenteLongitud;
  puntosClave: string[];
  source: string | null;
  categoryId: string | null;
  createdAt: string;
};

export type KnPrincipleVM = {
  id: string;
  text: string | null;
  source: string | null;
};

export type KnSystemVM = {
  id: string;
  name: string;
  desc: string | null;
};
