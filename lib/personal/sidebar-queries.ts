import { createClient } from "@/lib/supabase/server";
import type { SidebarData } from "./sidebar";

export async function getSidebarData(): Promise<SidebarData> {
  const supabase = await createClient();

  const [s, sub, items] = await Promise.all([
    supabase.schema("personal").from("sidebar_sections").select("*").order("orden"),
    supabase.schema("personal").from("sidebar_subsections").select("*").order("orden"),
    supabase.schema("personal").from("sidebar_items").select("*").order("orden"),
  ]);

  return {
    sections: (s.data ?? []).map((r) => ({
      id: r.id,
      nombre: r.nombre,
      icono: r.icono ?? null,
      orden: r.orden,
      esCore: r.es_core,
      visible: r.visible,
    })),
    subsections: (sub.data ?? []).map((r) => ({
      id: r.id,
      sectionId: r.section_id,
      nombre: r.nombre,
      orden: r.orden,
      esCore: r.es_core,
      visible: r.visible,
    })),
    items: (items.data ?? []).map((r) => ({
      id: r.id,
      sectionId: r.section_id,
      subsectionId: r.subsection_id ?? null,
      nombre: r.nombre,
      ruta: r.ruta,
      icono: r.icono ?? null,
      orden: r.orden,
      esCore: r.es_core,
      visible: r.visible,
    })),
  };
}
