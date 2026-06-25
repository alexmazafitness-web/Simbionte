import { calcularMRR, clientesActivos, type ClienteVM } from "@/lib/coaching/clientes";
import { OBJETIVO_MRR } from "@/lib/coaching/constants";
import { fmtDateCorta } from "@/lib/coaching/format";
import { PagoPill } from "./statusPills";

function KpiCard({
  label,
  value,
  badge,
  badgeVariant,
}: {
  label: string;
  value: string;
  badge: string;
  badgeVariant: "ok" | "warn" | "bad";
}) {
  const dotClass = { ok: "bg-ok", warn: "bg-warn", bad: "bg-bad" }[badgeVariant];
  const textClass = { ok: "text-ok", warn: "text-warn", bad: "text-bad" }[badgeVariant];
  const bgClass = { ok: "bg-ok-bg", warn: "bg-warn-bg", bad: "bg-bad-bg" }[badgeVariant];

  return (
    <div className="rounded-2xl border border-line-soft bg-panel p-4">
      <div className="min-h-[27px] text-[10.5px] font-semibold tracking-wide text-text-dim uppercase">{label}</div>
      <div className="my-2 font-display text-[42px] leading-[0.85]">{value}</div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${bgClass} ${textClass}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        {badge}
      </span>
    </div>
  );
}

export function PagosView({ clientes }: { clientes: ClienteVM[] }) {
  const activos = clientesActivos(clientes);
  const mrrExacto = calcularMRR(clientes);
  const mrrRedondo = Math.round(mrrExacto);

  const vencidos = activos.filter((c) => c.pagoD !== null && c.pagoD < 0);
  const proximos = activos.filter((c) => c.pagoD !== null && c.pagoD >= 0 && c.pagoD <= 7);
  const vencidoTotal = Math.round(vencidos.reduce((s, c) => s + (c.cuota ?? 0), 0));
  const proximoTotal = Math.round(proximos.reduce((s, c) => s + (c.cuota ?? 0), 0));
  const ticketMedio = activos.length ? Math.round(mrrExacto / activos.length) : 0;

  const sorted = [...activos].sort((a, b) => (a.pagoD ?? 0) - (b.pagoD ?? 0));

  return (
    <div className="px-10 py-10">
      <div className="mb-9 grid grid-cols-4 gap-3.5">
        <KpiCard label="MRR activo" value={`${mrrRedondo}€`} badge={`${activos.length} ${activos.length === 1 ? "cliente" : "clientes"}`} badgeVariant="ok" />
        <KpiCard label="Vencido" value={`${vencidoTotal}€`} badge={`${vencidos.length} ${vencidos.length === 1 ? "cliente" : "clientes"}`} badgeVariant="bad" />
        <KpiCard
          label="Cobra en 7 días"
          value={`${proximoTotal}€`}
          badge={`${proximos.length} ${proximos.length === 1 ? "cliente" : "clientes"}`}
          badgeVariant="warn"
        />
        <KpiCard label="Ticket medio" value={`${ticketMedio}€`} badge="/ mes" badgeVariant="ok" />
      </div>

      <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Estado de cobros
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">
          {sorted.filter((c) => c.pagoD !== null && c.pagoD <= 7).length}
        </span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="flex flex-col gap-2.5">
        {sorted.map((c) => (
          <div key={c.id} className="flex items-center gap-4 rounded-xl border border-line-soft bg-panel px-4 py-3.5">
            <div className="flex min-w-[210px] items-center gap-3">
              <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-panel-3 font-heading text-xs font-bold text-gold">
                {c.iniciales}
              </div>
              <div>
                <div className="font-semibold">{c.nombre}</div>
                <div className="text-[11px] text-text-dim">
                  {c.recurrencia ?? "—"} · {c.cuota !== null ? `${c.cuota} €` : "—"}
                </div>
              </div>
            </div>
            <div className="flex-1 text-[12px] text-text-2">Vence {fmtDateCorta(c.proximoPago)}</div>
            <PagoPill dias={c.pagoD} />
          </div>
        ))}
        {sorted.length === 0 && <p className="py-9 text-center text-text-dim">Sin clientes activos.</p>}
      </div>

      <p className="mt-6 text-[11.5px] text-text-dim">Objetivo de MRR: {OBJETIVO_MRR.toLocaleString("es-ES")} €</p>
    </div>
  );
}
