export type CredencialCategoria = "api_key" | "password" | "credencial" | "otro";

export const CATEGORIA_LABELS: Record<CredencialCategoria, string> = {
  api_key:    "API Keys",
  password:   "Contraseñas",
  credencial: "Credenciales",
  otro:       "Otros",
};

export const CATEGORIA_LIST: { value: CredencialCategoria; label: string }[] = [
  { value: "api_key",    label: "API Key" },
  { value: "password",   label: "Contraseña" },
  { value: "credencial", label: "Credencial" },
  { value: "otro",       label: "Otro" },
];

// Mismos tonos que FRONT_COLOR (constants.ts) para mantener la paleta única del proyecto.
export const CATEGORIA_COLOR: Record<CredencialCategoria, string> = {
  api_key:    "#C9A96E", // dorado
  password:   "#6BA3E0", // azul
  credencial: "#5DCAA5", // verde
  otro:       "#8a8a8a", // gris
};

// Nunca incluye el valor descifrado ni el cifrado — solo llega al cliente
// vía /api/credenciales/reveal, bajo demanda y de forma temporal.
export type CredencialVM = {
  id: string;
  nombre: string;
  categoria: CredencialCategoria;
  servicio: string | null;
  descripcion: string | null;
  url: string | null;
  createdAt: string;
};
