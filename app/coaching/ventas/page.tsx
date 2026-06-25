import { listLlamadas } from "@/lib/coaching/ventas-queries";
import { listLeads } from "@/lib/coaching/leads";
import { VentasPageClient } from "@/components/shared/ventas/VentasPageClient";

export default async function VentasPage() {
  const [llamadas, leads] = await Promise.all([listLlamadas(), listLeads()]);
  // El registro de llamadas solo debe ofrecer leads activos en el embudo —
  // los ya convertidos a cliente o descartados no son objetivo de una nueva llamada.
  const leadsActivos = leads.filter((l) => l.etapa !== "cliente" && l.etapa !== "descartado");
  return <VentasPageClient llamadas={llamadas} leads={leadsActivos} />;
}
