export type RevisionVM = {
  ingresos: string;
  instagram: string;
  pendiente: string;
  palanca: string;
  tres: string;
  recarga: string;
};

export const REVISION_VACIA: RevisionVM = {
  ingresos: "",
  instagram: "",
  pendiente: "",
  palanca: "",
  tres: "",
  recarga: "",
};

export const PALANCA_OPCIONES = [
  "Captación Instagram",
  "Cierre de ventas DM",
  "Contenido caso Adil",
  "Retención clientes",
  "Sistema onboarding",
  "Highlights Instagram",
];
