import { clientesActivos, type ClienteVM } from "@/lib/coaching/clientes";
import { fmtDateCorta } from "@/lib/coaching/format";
import { MesoPill } from "./statusPills";

const TOTAL_REFERENCIA = 70;

export function MesociclosList({ clientes }: { clientes: ClienteVM[] }) {
  const activos = clientesActivos(clientes);
  const sorted = [...activos].sort((a, b) => (a.mesociclo?.diasRestantes ?? 0) - (b.mesociclo?.diasRestantes ?? 0));

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Mesociclos en curso
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">
          {activos.length}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((c) => {
          const dias = c.mesociclo?.diasRestantes ?? null;
          const done = dias !== null ? Math.max(0, Math.min(TOTAL_REFERENCIA, TOTAL_REFERENCIA - dias)) : 0;
          const pct = Math.round((done / TOTAL_REFERENCIA) * 100);

          return (
            <div key={c.id} className="flex items-center gap-4 rounded-xl border border-line-soft bg-panel px-4 py-3.5">
              <div className="flex min-w-[210px] items-center gap-3">
                <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-panel-3 font-heading text-xs font-bold text-gold">
                  {c.iniciales}
                </div>
                <div>
                  <div className="font-semibold">{c.nombre}</div>
                  <div className="text-[11px] text-text-dim">
                    {c.mesociclo ? `${c.mesociclo.numeroMicrociclos} × ${c.mesociclo.diasMicrociclo}d` : "—"}
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-[12px] text-text-2">Cierra {fmtDateCorta(c.mesociclo?.fechaFin ?? null)}</div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#9a7c47] to-gold"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-2xl leading-[0.85]">
                  {dias !== null ? (dias < 0 ? `–${Math.abs(dias)}` : dias) : "—"}
                  <span className="text-[13px] text-text-dim">d</span>
                </div>
                <MesoPill estado={c.mesociclo?.estado ?? null} />
              </div>
            </div>
          );
        })}
        {sorted.length === 0 && <p className="py-9 text-center text-text-dim">Sin clientes activos.</p>}
      </div>
    </div>
  );
}
