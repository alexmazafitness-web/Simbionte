import { clientesActivos, hasNotas, type ClienteVM } from "@/lib/coaching/clientes";
import { CATEGORIAS } from "@/lib/coaching/constants";
import { fmtDateCorta } from "@/lib/coaching/format";
import { Chip } from "@/components/ui/Chip";
import { Pill } from "@/components/ui/Pill";
import { SearchInput } from "@/components/ui/SearchInput";
import { MesoPill, PagoPill, RevisionPill } from "./statusPills";

export type ClienteFiltro = "all" | "pago" | "meso" | "nota" | "baja";
export type ClienteOrden = "antiguedad" | "alfabetico";

const FILTROS: { value: ClienteFiltro; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "pago", label: "Pago próximo" },
  { value: "meso", label: "Meso a actualizar" },
  { value: "nota", label: "Con nota" },
  { value: "baja", label: "Bajas" },
];

function notasCount(c: ClienteVM): number {
  return CATEGORIAS.reduce((s, cat) => s + c.notas[cat].length, 0);
}

export function ClientesTable({
  clientes,
  search,
  onSearchChange,
  filtro,
  onFiltroChange,
  orden,
  onOrdenChange,
  onOpenDrawer,
  onNuevoCliente,
}: {
  clientes: ClienteVM[];
  search: string;
  onSearchChange: (v: string) => void;
  filtro: ClienteFiltro;
  onFiltroChange: (f: ClienteFiltro) => void;
  orden: ClienteOrden;
  onOrdenChange: (o: ClienteOrden) => void;
  onOpenDrawer: (id: string) => void;
  onNuevoCliente: () => void;
}) {
  const q = search.toLowerCase();
  let list = clientes.filter((c) => c.nombre.toLowerCase().includes(q));

  if (filtro === "baja") {
    list = list.filter((c) => c.estado === "baja");
  } else {
    list = clientesActivos(list);
    if (filtro === "pago") list = list.filter((c) => c.pagoD !== null && c.pagoD <= 7);
    if (filtro === "meso") list = list.filter((c) => c.mesociclo && c.mesociclo.estado !== "EN_CURSO");
    if (filtro === "nota") list = list.filter(hasNotas);
  }

  if (orden === "antiguedad") {
    list = [...list].sort((a, b) => (a.fechaAlta ?? "").localeCompare(b.fechaAlta ?? ""));
  } else {
    list = [...list].sort((a, b) => a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" }));
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={onSearchChange} placeholder="Buscar cliente…" />
        <div className="flex gap-1.5">
          {FILTROS.map((f) => (
            <Chip key={f.value} active={filtro === f.value} onClick={() => onFiltroChange(f.value)}>
              {f.label}
            </Chip>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="flex overflow-hidden rounded-md border border-line text-[11px]">
            <button
              type="button"
              onClick={() => onOrdenChange("antiguedad")}
              className={`px-2.5 py-1.5 transition ${
                orden === "antiguedad" ? "bg-panel-3 text-foreground" : "text-text-dim hover:text-text-2"
              }`}
            >
              Antigüedad
            </button>
            <div className="w-px self-stretch bg-line" />
            <button
              type="button"
              onClick={() => onOrdenChange("alfabetico")}
              className={`px-2.5 py-1.5 transition ${
                orden === "alfabetico" ? "bg-panel-3 text-foreground" : "text-text-dim hover:text-text-2"
              }`}
            >
              Alfabético
            </button>
          </div>
          <button
            type="button"
            onClick={onNuevoCliente}
            className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright"
          >
            + Nuevo cliente
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-panel-2">
              {["Cliente", "Cuota", "Equiv. mensual", "Alta", "Permanencia", "Próximo pago", "Próxima revisión", "Mesociclo", "Notas", "LTV"].map(
                (h, i) => (
                  <th
                    key={h}
                    className={`border-b border-line px-4 py-3 text-[10px] font-semibold tracking-wider text-text-dim uppercase ${
                      i === 9 ? "text-right" : "text-left"
                    }`}
                  >
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-9 text-center text-text-dim">
                  Sin clientes que coincidan
                </td>
              </tr>
            ) : (
              list.map((c) => {
                const baja = c.estado === "baja";
                const n = notasCount(c);
                return (
                  <tr
                    key={c.id}
                    onClick={() => onOpenDrawer(c.id)}
                    className={`cursor-pointer border-b border-line-soft last:border-b-0 transition hover:bg-panel-2 ${
                      baja ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-panel-3 font-heading text-xs font-bold text-gold">
                          {c.iniciales}
                        </div>
                        <div className="font-semibold">{c.nombre}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[13.5px]">
                      {c.cuota ?? "—"}
                      {c.cuota !== null && (
                        <span className="text-[11px] text-text-dim"> € / {c.recurrencia?.toLowerCase()}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[13.5px]">
                      {c.cuota !== null && c.recurrencia ? (
                        <span className="font-medium" style={{ color: "#C9A96E" }}>
                          {(c.cuota / { Mensual: 1, Trimestral: 3, Semestral: 6, Anual: 12 }[c.recurrencia]!).toLocaleString("es-ES", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}€
                        </span>
                      ) : <span className="text-text-dim">—</span>}
                    </td>
                    <td className="px-4 py-3 text-[12.5px] text-text-2">{fmtDateCorta(c.fechaAlta)}</td>
                    <td className="px-4 py-3">
                      <div className="text-[13px]">{c.permanencia}m</div>
                      {c.fechaAlta && (
                        <div className="text-xs" style={{ color: "#6b7280" }}>
                          {Math.floor((Date.now() - new Date(c.fechaAlta + "T12:00:00").getTime()) / 86_400_000)} días
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {baja ? <Pill variant="bad">Baja {c.bajaFecha ? fmtDateCorta(c.bajaFecha) : ""}</Pill> : <PagoPill dias={c.pagoD} />}
                    </td>
                    <td className="px-4 py-3">{baja ? <Pill variant="neutral">—</Pill> : <RevisionPill dias={c.revD} />}</td>
                    <td className="px-4 py-3">{baja ? <Pill variant="neutral">—</Pill> : <MesoPill estado={c.mesociclo?.estado ?? null} />}</td>
                    <td className="px-4 py-3">
                      {n ? <Pill variant="neutral">{n}</Pill> : <span className="text-text-dim">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{c.ltvAcumulado} €</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
