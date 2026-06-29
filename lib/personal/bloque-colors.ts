export type BloqueStyle = { bg: string; text: string; border: string };

// rgba-based backgrounds so the tint is clearly visible over #141414
// format: bg = rgba(r,g,b,0.18), border = rgba(r,g,b,0.55), text = light tint

const SURFACE_0: BloqueStyle = { bg: "transparent",          text: "#374151", border: "transparent" };
const SURFACE_1: BloqueStyle = { bg: "rgba(255,255,255,.04)", text: "#6b7280", border: "rgba(255,255,255,.08)" };

const MAP: [RegExp, BloqueStyle][] = [
  // Admin — revisión de pagos → purple
  // Keep before /revisi[oó]n/ — title contains both words
  [/admin/i,              { bg: "rgba(124,58,237,.18)",   text: "#c4b5fd", border: "rgba(124,58,237,.55)" }],

  // Revisión semanal → rose/pink
  [/revisi[oó]n/i,        { bg: "rgba(219,39,119,.18)",   text: "#f472b6", border: "rgba(219,39,119,.55)" }],

  // Ritual de mañana → warm brown
  [/ritual/i,             { bg: "rgba(120,100,80,.18)",   text: "#d4cabf", border: "rgba(120,100,80,.55)" }],

  // Simbionte → orange-brick
  [/simbionte/i,          { bg: "rgba(194,65,12,.18)",    text: "#fb923c", border: "rgba(194,65,12,.55)" }],

  // Contenido Tipo A / Batch → indigo vivid
  [/contenido tipo a/i,   { bg: "rgba(99,102,241,.18)",   text: "#a5b4fc", border: "rgba(99,102,241,.55)" }],
  [/batch/i,              { bg: "rgba(99,102,241,.18)",   text: "#a5b4fc", border: "rgba(99,102,241,.55)" }],

  // Contenido Tipo B / Métricas → indigo softer
  [/contenido tipo b/i,   { bg: "rgba(79,70,229,.18)",    text: "#818cf8", border: "rgba(79,70,229,.55)" }],
  [/m[eé]tricas/i,        { bg: "rgba(79,70,229,.18)",    text: "#818cf8", border: "rgba(79,70,229,.55)" }],

  // Formación → sky blue
  [/formaci[oó]n/i,       { bg: "rgba(37,99,235,.18)",    text: "#93c5fd", border: "rgba(37,99,235,.55)" }],

  // Clientes batch → amber
  [/clientes/i,           { bg: "rgba(217,119,6,.18)",    text: "#fbbf24", border: "rgba(217,119,6,.55)" }],

  // Gym → emerald green
  [/gym/i,                { bg: "rgba(5,150,105,.18)",    text: "#34d399", border: "rgba(5,150,105,.55)" }],

  // Comida → surface neutral
  [/comida/i,             SURFACE_1],

  // Buffer libre → surface neutral (before /libre/ catch-all)
  [/buffer/i,             SURFACE_1],

  // Apagado total → near-invisible
  [/apagado/i,            { bg: "rgba(0,0,0,.35)",        text: "#374151", border: "rgba(255,255,255,.04)" }],

  // Semana cerrada / Transición / Tiempo libre → recessed
  [/semana cerrada|transici[oó]n|tiempo|libre/i, SURFACE_0],
];

const DEFAULT_STYLE: BloqueStyle = SURFACE_1;

export function getBloqueStyle(title: string): BloqueStyle {
  for (const [re, style] of MAP) {
    if (re.test(title)) return style;
  }
  return DEFAULT_STYLE;
}
