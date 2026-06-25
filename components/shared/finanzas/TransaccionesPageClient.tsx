"use client";

import { useMemo, useState, useTransition } from "react";
import { Chip } from "@/components/ui/Chip";
import { SearchInput } from "@/components/ui/SearchInput";
import { PERIODOS, type Periodo } from "@/lib/personal/finanzas-constants";
import { filterPeriodo, fmtEUR, type TransaccionVM, type TipoTransaccion } from "@/lib/personal/finanzas";
import { crearTransaccion, eliminarTransaccion, importarTransaccionesCsv, type FilaCsv, type TransaccionInput } from "@/lib/personal/finanzas-actions";
import { MetricCard } from "./MetricCard";
import { TransaccionModal } from "./TransaccionModal";
import { ImportarCsvModal } from "./ImportarCsvModal";

export function TransaccionesPageClient({ transacciones }: { transacciones: TransaccionVM[] }) {
  const [periodo, setPeriodo] = useState<Periodo>("este_mes");
  const [filtroTipo, setFiltroTipo] = useState<"" | TipoTransaccion>("");
  const [filtroCategoria, setFiltroCategoria] = useState("");
  const [buscar, setBuscar] = useState("");
  const [modalNueva, setModalNueva] = useState(false);
  const [modalImportar, setModalImportar] = useState(false);
  const [pending, startTransition] = useTransition();

  const delPeriodo = useMemo(() => filterPeriodo(transacciones, periodo), [transacciones, periodo]);

  const ingresos = delPeriodo.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.importe, 0);
  const gastos = delPeriodo.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.importe, 0);
  const balance = ingresos - gastos;
  const tasaAhorro = ingresos > 0 ? (balance / ingresos) * 100 : 0;

  const categoriasDisponibles = useMemo(() => [...new Set(transacciones.map((t) => t.categoria))].sort(), [transacciones]);

  const listaFiltrada = delPeriodo.filter((t) => {
    if (filtroTipo && t.tipo !== filtroTipo) return false;
    if (filtroCategoria && t.categoria !== filtroCategoria) return false;
    const q = buscar.toLowerCase();
    if (q && !(t.descripcion ?? "").toLowerCase().includes(q) && !t.categoria.toLowerCase().includes(q)) return false;
    return true;
  });

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <select
          className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-[12.5px] text-text-2 outline-none"
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value as Periodo)}
        >
          {PERIODOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => setModalImportar(true)} className="rounded-lg bg-panel-2 px-4 py-2.5 text-[12.5px] font-semibold text-text-2 hover:text-foreground">
          ↑ Importar CSV
        </button>
        <button type="button" onClick={() => setModalNueva(true)} className="ml-auto rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright">
          + Nueva transacción
        </button>
      </div>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3.5">
        <MetricCard label="Ingresos" value={fmtEUR(ingresos)} color="green" />
        <MetricCard label="Gastos" value={fmtEUR(gastos)} color="red" />
        <MetricCard label="Balance" value={fmtEUR(balance)} color={balance >= 0 ? "green" : "red"} />
        <MetricCard label="Tasa de ahorro" value={`${tasaAhorro.toFixed(1)}%`} color={tasaAhorro >= 20 ? "green" : "red"} />
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <SearchInput value={buscar} onChange={setBuscar} placeholder="Buscar…" />
        <div className="flex gap-1.5">
          <Chip active={filtroTipo === ""} onClick={() => setFiltroTipo("")}>
            Todos
          </Chip>
          <Chip active={filtroTipo === "ingreso"} onClick={() => setFiltroTipo("ingreso")}>
            Ingresos
          </Chip>
          <Chip active={filtroTipo === "gasto"} onClick={() => setFiltroTipo("gasto")}>
            Gastos
          </Chip>
        </div>
        <select
          className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-[12px] text-text-2 outline-none"
          value={filtroCategoria}
          onChange={(e) => setFiltroCategoria(e.target.value)}
        >
          <option value="">Todas las categorías</option>
          {categoriasDisponibles.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
        {listaFiltrada.length === 0 ? (
          <p className="px-4 py-9 text-center text-text-dim">Sin transacciones en este período. Añade una o importa un CSV.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-panel-2">
                <th className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">Fecha</th>
                <th className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">Descripción</th>
                <th className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">Categoría</th>
                <th className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">Tipo</th>
                <th className="px-4 py-2.5 text-right text-[10px] tracking-wide text-text-dim uppercase">Importe</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {listaFiltrada.map((t) => (
                <tr key={t.id} className="border-t border-line-soft">
                  <td className="px-4 py-2.5 whitespace-nowrap text-text-dim">{t.fecha ?? "—"}</td>
                  <td className="max-w-[200px] truncate px-4 py-2.5">{t.descripcion || "—"}</td>
                  <td className="px-4 py-2.5">
                    <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[11px] text-text-2">{t.categoria}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold uppercase ${t.tipo === "ingreso" ? "bg-ok-bg text-ok" : "bg-bad-bg text-bad"}`}>
                      {t.tipo === "ingreso" ? "Ingreso" : "Gasto"}
                    </span>
                  </td>
                  <td className={`px-4 py-2.5 text-right font-semibold whitespace-nowrap ${t.tipo === "ingreso" ? "text-ok" : "text-bad"}`}>
                    {t.tipo === "ingreso" ? "+" : "−"}
                    {fmtEUR(t.importe, 2)}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button type="button" onClick={() => run(() => eliminarTransaccion(t.id))} className="text-text-dim hover:text-bad">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <TransaccionModal
        open={modalNueva}
        onClose={() => setModalNueva(false)}
        pending={pending}
        onSubmit={(input: TransaccionInput) => run(() => crearTransaccion(input), () => setModalNueva(false))}
      />
      <ImportarCsvModal
        open={modalImportar}
        onClose={() => setModalImportar(false)}
        pending={pending}
        onConfirm={(filas: FilaCsv[]) => run(() => importarTransaccionesCsv(filas), () => setModalImportar(false))}
      />
    </div>
  );
}
