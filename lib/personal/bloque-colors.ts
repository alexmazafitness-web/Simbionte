export type BloqueStyle = { bg: string; text: string; border: string };

// Paleta dark + neón premium para los bloques recurrentes del calendario.
// Cada entrada mapea un regex de título → { bg, text, border }, aplicado como
// inline style sobre el grid (#141414).
//   bg     → fondo oscuro semitransparente (rgba, opacidad .12–.20)
//   text   → versión neón clara del tono
//   border → versión vibrante del tono (borde izquierdo de 3px)

// ── tokens neutros ──────────────────────────────────────────────────────────
// surface-1 = bloques de relleno (buffer, comida): tinte mínimo, sin borde.
// recessed  = bloques "recesivos" (transición, tiempo libre, semana cerrada).
const SURFACE_1: BloqueStyle = { bg: "rgba(255,255,255,.04)", text: "#9ca3af", border: "transparent" };
const RECESSED:  BloqueStyle = { bg: "transparent",           text: "#4b5563", border: "transparent" };

// ── mapa de paleta (primer match gana — específico antes que general) ────────
const MAP: [RegExp, BloqueStyle][] = [
  // Admin — índigo. ANTES de /revisi/: "Admin — revisión de pagos" contiene
  // ambas palabras y debe caer aquí, no en rosa.
  [/admin/i,              { bg: "rgba(99,102,241,.13)",  text: "#818cf8", border: "#6366f1" }],

  // Revisión semanal — rosa neón
  [/revisi[oó]n/i,        { bg: "rgba(236,72,153,.13)",  text: "#f472b6", border: "#ec4899" }],

  // Ritual de mañana — ámbar cálido
  [/ritual/i,             { bg: "rgba(251,191,36,.13)",  text: "#fbbf24", border: "#fbbf24" }],

  // Simbionte — rojo-naranja
  [/simbionte/i,          { bg: "rgba(239,68,68,.13)",   text: "#f87171", border: "#ef4444" }],

  // Clientes batch — ámbar-naranja. ANTES de /batch/: "Clientes batch 1/2"
  // contiene "batch" y debe caer aquí, no en el patrón de contenido.
  [/clientes/i,           { bg: "rgba(245,158,11,.13)",  text: "#fcd34d", border: "#f59e0b" }],

  // Contenido Tipo A — violeta neón
  [/contenido tipo a/i,   { bg: "rgba(139,92,246,.15)",  text: "#a78bfa", border: "#8b5cf6" }],

  // Contenido Tipo B — púrpura suave
  [/contenido tipo b/i,   { bg: "rgba(168,85,247,.13)",  text: "#c084fc", border: "#a855f7" }],

  // Batch de contenido — mismo tono que Contenido Tipo A (violeta neón).
  // Seguro tras /clientes/: el único "batch" restante es el de contenido.
  [/batch/i,              { bg: "rgba(139,92,246,.15)",  text: "#a78bfa", border: "#8b5cf6" }],

  // Métricas Instagram — púrpura suave (familia contenido)
  [/m[eé]tricas/i,        { bg: "rgba(168,85,247,.13)",  text: "#c084fc", border: "#a855f7" }],

  // Formación — azul eléctrico
  [/formaci[oó]n/i,       { bg: "rgba(59,130,246,.13)",  text: "#60a5fa", border: "#3b82f6" }],

  // Gym — verde neón
  [/gym/i,                { bg: "rgba(16,185,129,.13)",  text: "#34d399", border: "#10b981" }],

  // Comida — surface-1 (relleno neutro, sin borde)
  [/comida/i,             SURFACE_1],

  // Buffer libre — surface-1. ANTES del grupo recesivo (que matchea "libre").
  [/buffer/i,             SURFACE_1],

  // Apagado total — casi invisible (día de descanso)
  [/apagado/i,            { bg: "rgba(0,0,0,.35)",       text: "#374151", border: "transparent" }],

  // Semana cerrada / Transición / Tiempo libre — recesivos
  [/semana cerrada|transici[oó]n|tiempo libre/i, RECESSED],
];

const DEFAULT_STYLE: BloqueStyle = SURFACE_1;

export function getBloqueStyle(title: string): BloqueStyle {
  for (const [re, style] of MAP) {
    if (re.test(title)) return style;
  }
  return DEFAULT_STYLE;
}
