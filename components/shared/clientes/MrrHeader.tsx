import { clientesActivos, type ClienteVM } from "@/lib/coaching/clientes";
import { MESES_CICLO, OBJETIVO_MRR } from "@/lib/coaching/constants";

function precioMensual(c: ClienteVM): number {
  if (!c.cuota || !c.recurrencia) return 0;
  return c.cuota / MESES_CICLO[c.recurrencia];
}

export function MrrHeader({ clientes }: { clientes: ClienteVM[] }) {
  const activos = clientesActivos(clientes);
  const mrrExacto = activos.reduce((s, c) => s + precioMensual(c), 0);
  const mrrRedondo = Math.round(mrrExacto);
  const pct = Math.min(100, Math.round((mrrExacto / OBJETIVO_MRR) * 100));

  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-6 border-b border-line-soft pb-6">
      <div className="min-w-[220px]">
        <div className="mb-1.5 text-[11.5px] font-medium text-text-2">
          {mrrExacto.toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € /{" "}
          {OBJETIVO_MRR.toLocaleString("es-ES")} € → <b className="font-semibold text-foreground">{pct}%</b>
        </div>
        <div className="h-[2px] overflow-hidden rounded-full bg-line">
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <div className="text-right">
        <div className="font-display text-3xl leading-none text-gold">{mrrRedondo}&nbsp;€</div>
      </div>
    </div>
  );
}
