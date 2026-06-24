import { listClientes } from "@/lib/coaching/clientes-queries";
import { clientesActivos } from "@/lib/coaching/clientes";
import { listGruposRevision } from "@/lib/coaching/grupos";
import { RevisionesBoard } from "@/components/shared/clientes/RevisionesBoard";

export default async function RevisionesPage() {
  const [clientes, grupos] = await Promise.all([listClientes(), listGruposRevision()]);

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Tablero de revisiones · por grupo
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">
          {clientesActivos(clientes).length}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>
      <RevisionesBoard clientes={clientes} grupos={grupos} />
    </div>
  );
}
