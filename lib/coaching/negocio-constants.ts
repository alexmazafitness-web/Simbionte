// Estructura fija del roadmap — reference/hoja-de-ruta-asesoria.html.
// Tracks y fases son estructura, no datos: no viven en la base de datos.

export type TrackId = "ciclo" | "ops";
export type FaseId = "e1" | "e2" | "e3" | "e4" | "e5" | "e6" | "e7" | "o1";

export type FaseMeta = {
  id: FaseId;
  track: TrackId;
  numero: string;
  nombre: string;
  objetivo: string;
  esNueva?: boolean;
};

export const TRACKS: { id: TrackId; modulo: string; nombre: string }[] = [
  { id: "ciclo", modulo: "Módulo 1", nombre: "Ciclo del servicio" },
  { id: "ops", modulo: "Módulo 2", nombre: "Operaciones y sistemas" },
];

export const FASES: FaseMeta[] = [
  { id: "e1", track: "ciclo", numero: "01", nombre: "ATRACCIÓN Y CAPTACIÓN", objetivo: "Generar un flujo constante y predecible de leads cualificados." },
  { id: "e2", track: "ciclo", numero: "02", nombre: "LLAMADA DE VENTA", objetivo: "Convertir oportunidades en clientes mediante un proceso comercial repetible." },
  { id: "e3", track: "ciclo", numero: "03", nombre: "ONBOARDING", objetivo: "Integrar nuevos clientes de forma profesional y sin fricción." },
  { id: "e4", track: "ciclo", numero: "04", nombre: "EJECUCIÓN Y GESTIÓN DEL PROGRAMA", objetivo: "Generar resultados consistentes mediante sistemas y procesos optimizados.", esNueva: true },
  { id: "e5", track: "ciclo", numero: "05", nombre: "ANÁLISIS Y OPTIMIZACIÓN", objetivo: "Convertir datos en decisiones que mejoran el sistema de forma continua.", esNueva: true },
  { id: "e6", track: "ciclo", numero: "06", nombre: "FIDELIZACIÓN Y RETENCIÓN", objetivo: "Maximizar permanencia, satisfacción y valor de vida del cliente." },
  { id: "e7", track: "ciclo", numero: "07", nombre: "EXPANSIÓN DE PRODUCTO", objetivo: "Diversificar la oferta para crecer en ingresos sin depender solo del 1:1.", esNueva: true },
  { id: "o1", track: "ops", numero: "P", nombre: "OPERACIONES Y SISTEMAS", objetivo: "Que el sistema sea documentable, auditable y delegable — sostiene a las 7 etapas a la vez.", esNueva: true },
];

export const TIPO_TARJETA_LABEL = { existe: "Existe", optimizar: "Optimizar", crear: "Crear" } as const;
export type TipoTarjeta = keyof typeof TIPO_TARJETA_LABEL;

export const ESTADO_LABEL = { pendiente: "Pendiente", curso: "En curso", hecho: "Hecho" } as const;
export type EstadoTarjeta = keyof typeof ESTADO_LABEL;

export const PRIORIDADES: { rango: string; titulo: string; texto: string; cuando: string }[] = [
  { rango: "PRIORIDAD 01", titulo: "Volumen", texto: "Sistema de contenido sostenible + protocolo de setting escrito. Es el único cuello de botella real.", cuando: "Entre semana · 1–2 h" },
  { rango: "PRIORIDAD 02", titulo: "Manualización", texto: "Vídeos explicativos + protocolo de entrega invariable MESO/NUTRI/SEGUIMIENTO. Requisito para escalar sin romperte.", cuando: "Finde · sprints" },
  { rango: "PRIORIDAD 03", titulo: "Automatización", texto: "Mensajería de onboarding + nutrición de leads tibios. Libera tu tiempo una vez el proceso está estandarizado.", cuando: "Finde" },
  { rango: "PRIORIDAD 04", titulo: "Medición", texto: "Panel de métricas y post-mortem de cliente. Sin esto, optimizas a ciegas.", cuando: "Finde" },
  { rango: "PRIORIDAD 05", titulo: "Expansión", texto: "Primer producto más allá del 1:1 (grupal o digital). Solo cuando 01–04 estén sólidos.", cuando: "Medio plazo" },
  { rango: "PRIORIDAD 06", titulo: "SaaS", texto: "Sprints en app.alexmaza.es. El último paso, no el primero.", cuando: "Largo plazo" },
];
