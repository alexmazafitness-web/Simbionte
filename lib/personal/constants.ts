export const FRONTS = ["coaching", "formacion", "personal", "contenido"] as const;
export type Front = (typeof FRONTS)[number];

export const FRONT_LABEL: Record<Front, string> = {
  coaching: "Coaching",
  formacion: "Formación",
  personal: "Personal",
  contenido: "Contenido",
};

// rgb del dorado/verde/azul/morado de marca, una entrada por frente.
export const FRONT_COLOR: Record<Front, string> = {
  coaching: "#C9A96E",
  formacion: "#5DCAA5",
  personal: "#6BA3E0",
  contenido: "#A78BDB",
};

export const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
export const DAYS_SH = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

// Plural correcto en español, derivado de DAYS: los días que ya terminan en
// "s" (lunes, martes, miércoles, jueves, viernes) son invariantes en plural;
// solo sábado y domingo añaden "s". Nunca concatenar "s" a ciegas (produce
// "Juevess", "Miércoless", etc.).
export const DAYS_PLURAL = DAYS.map((d) => (d.endsWith("s") ? d : `${d}s`));

export const INFRA_BUCKETS = [
  { id: "marca", name: "Marca / Web pública", emoji: "🌐", sub: "Tu escaparate" },
  { id: "servicio", name: "Procesos del servicio", emoji: "⚙️", sub: "Cara al cliente" },
  { id: "personal", name: "Personal / Interno", emoji: "🔒", sub: "Solo para ti" },
] as const;
export type InfraBucket = (typeof INFRA_BUCKETS)[number]["id"];

export const INFRA_PLATFORMS = ["Netlify", "Cloudflare", "Google", "Typeform", "Make", "Resend", "Hostinger", "Otro"];

export const KN_CATS_DEFAULT = [
  { id: "fitness", emoji: "🏋️", name: "Fitness" },
  { id: "nutricion", emoji: "🥗", name: "Nutrición" },
  { id: "negocio", emoji: "💰", name: "Negocio" },
  { id: "ventas", emoji: "🎯", name: "Ventas" },
  { id: "marketing", emoji: "📈", name: "Marketing" },
  { id: "psicologia", emoji: "🧠", name: "Psicología" },
  { id: "productividad", emoji: "⚙️", name: "Productividad" },
  { id: "contenido", emoji: "📱", name: "Contenido" },
  { id: "otros", emoji: "📚", name: "Otros" },
];

export const DESEOS_CATS_DEFAULT = [
  { emoji: "💻", name: "Tecnología" },
  { emoji: "👕", name: "Ropa" },
  { emoji: "🎟️", name: "Experiencias" },
  { emoji: "🏠", name: "Hogar" },
  { emoji: "📦", name: "Otros" },
];
