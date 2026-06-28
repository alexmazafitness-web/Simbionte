export type SidebarSection = {
  id: string;
  nombre: string;
  icono: string | null;
  orden: number;
  esCore: boolean;
  visible: boolean;
};

export type SidebarSubsection = {
  id: string;
  sectionId: string;
  nombre: string;
  orden: number;
  esCore: boolean;
  visible: boolean;
};

export type SidebarItem = {
  id: string;
  sectionId: string;
  subsectionId: string | null;
  nombre: string;
  ruta: string;
  icono: string | null;
  orden: number;
  esCore: boolean;
  visible: boolean;
};

export type SidebarData = {
  sections: SidebarSection[];
  subsections: SidebarSubsection[];
  items: SidebarItem[];
};

export type SectionChild =
  | { kind: "sub"; orden: number; sub: SidebarSubsection; items: SidebarItem[] }
  | { kind: "item"; orden: number; item: SidebarItem };

export type SectionVM = {
  section: SidebarSection;
  children: SectionChild[];
  isFlatLink: boolean; // section with exactly 1 direct item, 0 subsections
};

export function buildSectionVMs(data: SidebarData, showHidden = false): SectionVM[] {
  const sections = data.sections
    .filter((s) => showHidden || s.visible)
    .sort((a, b) => a.orden - b.orden);

  return sections.map((section) => {
    const subs = data.subsections
      .filter((s) => s.sectionId === section.id && (showHidden || s.visible))
      .sort((a, b) => a.orden - b.orden);

    const directItems = data.items
      .filter((i) => i.sectionId === section.id && i.subsectionId === null && (showHidden || i.visible))
      .sort((a, b) => a.orden - b.orden);

    const children: SectionChild[] = [
      ...subs.map((sub) => ({
        kind: "sub" as const,
        orden: sub.orden,
        sub,
        items: data.items
          .filter((i) => i.subsectionId === sub.id && (showHidden || i.visible))
          .sort((a, b) => a.orden - b.orden),
      })),
      ...directItems.map((item) => ({
        kind: "item" as const,
        orden: item.orden,
        item,
      })),
    ].sort((a, b) => a.orden - b.orden);

    const isFlatLink = subs.length === 0 && directItems.length === 1;

    return { section, children, isFlatLink };
  });
}

// All valid routes in the app — used by the add-item selector
export const RUTAS_APP: { label: string; ruta: string; grupo: string }[] = [
  { label: "Mi día",          ruta: "/personal/cerebro",              grupo: "Personal · Cerebro" },
  { label: "Tareas",          ruta: "/personal/cerebro/tareas",       grupo: "Personal · Cerebro" },
  { label: "Ideas",           ruta: "/personal/cerebro/ideas",        grupo: "Personal · Cerebro" },
  { label: "Recordatorios",   ruta: "/personal/cerebro/recordatorios",grupo: "Personal · Cerebro" },
  { label: "Calendario",      ruta: "/personal/cerebro/calendario",   grupo: "Personal · Cerebro" },
  { label: "Knowledge",       ruta: "/personal/cerebro/knowledge",    grupo: "Personal · Cerebro" },
  { label: "El Norte",        ruta: "/personal/cerebro/norte",        grupo: "Personal · Cerebro" },
  { label: "Revisión semanal",ruta: "/personal/cerebro/revision",     grupo: "Personal · Cerebro" },
  { label: "Infra",           ruta: "/personal/cerebro/infra",        grupo: "Personal · Cerebro" },
  { label: "Resumen",         ruta: "/personal/finanzas",             grupo: "Personal · Finanzas" },
  { label: "Transacciones",   ruta: "/personal/finanzas/transacciones",grupo: "Personal · Finanzas" },
  { label: "Inversiones",     ruta: "/personal/finanzas/inversiones", grupo: "Personal · Finanzas" },
  { label: "Crypto",          ruta: "/personal/finanzas/crypto",      grupo: "Personal · Finanzas" },
  { label: "Ahorro",          ruta: "/personal/finanzas/ahorro",      grupo: "Personal · Finanzas" },
  { label: "Deudas",          ruta: "/personal/finanzas/deudas",      grupo: "Personal · Finanzas" },
  { label: "Leads",           ruta: "/coaching/leads",                grupo: "Business" },
  { label: "Ventas",          ruta: "/coaching/ventas",               grupo: "Business" },
  { label: "Contenido",       ruta: "/coaching/contenido",            grupo: "Business" },
  { label: "Negocio",         ruta: "/coaching/negocio",              grupo: "Business" },
  { label: "Dashboard",       ruta: "/coaching/dashboard",            grupo: "Business" },
  { label: "Clientes",        ruta: "/coaching/clientes",             grupo: "Business" },
  { label: "Pagos",           ruta: "/coaching/pagos",                grupo: "Business" },
  { label: "Revisiones",      ruta: "/coaching/revisiones",           grupo: "Business" },
  { label: "Mesociclos",      ruta: "/coaching/mesociclos",           grupo: "Business" },
  { label: "Onboarding",     ruta: "/coaching/onboarding",           grupo: "Business" },
];
