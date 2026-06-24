import { clientesActivos, type ClienteVM } from "@/lib/coaching/clientes";
import { GRUPOS_CODIGOS } from "@/lib/coaching/constants";
import { fmtDateCorta } from "@/lib/coaching/format";
import type { GrupoRevision } from "@/lib/coaching/grupos";
import { RevisionPill } from "./statusPills";

export function RevisionesBoard({ clientes, grupos }: { clientes: ClienteVM[]; grupos: GrupoRevision[] }) {
  const activos = clientesActivos(clientes);
  const grupoPorCodigo = new Map(grupos.map((g) => [g.codigo, g]));

  return (
    <div className="grid grid-cols-4 gap-3.5">
      {GRUPOS_CODIGOS.map((codigo) => {
        const grupo = grupoPorCodigo.get(codigo);
        const miembros = activos.filter((c) => c.grupoCodigo === codigo);
        const proximas = miembros
          .map((c) => c.proximaRevision)
          .filter((d): d is string => !!d)
          .sort();
        const proxima = proximas[0] ?? null;

        return (
          <div key={codigo} className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
            <div className="flex items-center gap-2.5 border-b border-line px-4 py-3.5">
              <div className="font-display text-[26px] leading-[0.8] text-gold tracking-wide">{codigo}</div>
              <div>
                <div className="text-[12.5px] font-semibold">{grupo?.nombre ?? "—"}</div>
                <div className="text-[10.5px] text-text-dim">Próxima · {proxima ? fmtDateCorta(proxima) : "—"}</div>
              </div>
              <div className="ml-auto flex h-6 min-w-6 items-center justify-center rounded-md bg-panel-3 text-xs font-bold text-text-2">
                {miembros.length}
              </div>
            </div>
            <div className="p-2.5">
              {miembros.length === 0 ? (
                <div className="px-1.5 py-3 text-[12.5px] text-text-dim">Sin clientes en este grupo</div>
              ) : (
                miembros.map((c) => (
                  <div key={c.id} className="mb-2 rounded-lg bg-panel-2 p-3 last:mb-0">
                    <div className="text-[13px] font-semibold leading-tight">{c.nombre}</div>
                    <div className="mt-1 flex items-center gap-1.5 text-[11px] text-text-dim">
                      <RevisionPill dias={c.revD} />
                      <span>· {c.permanencia}m</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
