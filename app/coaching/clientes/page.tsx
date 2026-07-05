import { listClientes } from "@/lib/coaching/clientes-queries";
import { listTarifas } from "@/lib/coaching/tarifas";
import { listGruposRevision } from "@/lib/coaching/grupos";
import { ClientesPageClient } from "@/components/shared/clientes/ClientesPageClient";

export default async function ClientesPage({
  searchParams,
}: {
  searchParams: Promise<{ leadId?: string; nombre?: string; clienteId?: string }>;
}) {
  const params = await searchParams;
  const [clientes, tarifas, grupos] = await Promise.all([listClientes(), listTarifas(), listGruposRevision()]);

  const leadPrefill = params.leadId ? { id: params.leadId, nombre: params.nombre ?? "" } : undefined;
  const activos = clientes.filter((c) => c.estado === "activo").length;

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Clientes
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">
          {activos}
        </span>
      </div>
      <ClientesPageClient clientes={clientes} tarifas={tarifas} grupos={grupos} leadPrefill={leadPrefill} drawerPrefillId={params.clienteId} />
    </div>
  );
}
