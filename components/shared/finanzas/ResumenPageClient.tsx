"use client";

import { useMemo, useState } from "react";
import { PERIODOS, type Periodo } from "@/lib/personal/finanzas-constants";
import { filterPeriodo, fmtEUR, valorPosicion, type CryptoVM, type DeudaVM, type InversionVM, type ObjetivoVM, type TransaccionVM } from "@/lib/personal/finanzas";
import { MetricCard } from "./MetricCard";

const COLORES_DISTRIBUCION = ["bg-gold", "bg-warn", "bg-ok", "bg-[#60a5fa]"];

export function ResumenPageClient({
  transacciones,
  inversiones,
  crypto,
  deudas,
  objetivos,
  mrrCoaching,
}: {
  transacciones: TransaccionVM[];
  inversiones: InversionVM[];
  crypto: CryptoVM[];
  deudas: DeudaVM[];
  objetivos: ObjetivoVM[];
  mrrCoaching: number;
}) {
  const [periodo, setPeriodo] = useState<Periodo>("este_mes");

  const delPeriodo = useMemo(() => filterPeriodo(transacciones, periodo), [transacciones, periodo]);
  const ingresos = delPeriodo.filter((t) => t.tipo === "ingreso").reduce((s, t) => s + t.importe, 0);
  const gastos = delPeriodo.filter((t) => t.tipo === "gasto").reduce((s, t) => s + t.importe, 0);

  const totalInv = inversiones.reduce((s, i) => s + valorPosicion(i.precioActual, i.cantidad), 0);
  const totalCry = crypto.reduce((s, c) => s + valorPosicion(c.precioActual, c.cantidad), 0);
  const totalDeuda = deudas.reduce((s, d) => s + d.pendiente, 0);
  const totalObj = objetivos.reduce((s, o) => s + o.actual, 0);
  const liquidez = Math.max(0, ingresos - gastos);
  const neto = totalInv + totalCry + totalObj + liquidez - totalDeuda;

  const distribucion = [
    { label: "Inversiones", valor: totalInv },
    { label: "Crypto", valor: totalCry },
    { label: "Ahorro", valor: totalObj },
    { label: "Liquidez", valor: liquidez },
  ];
  const totalDistribucion = distribucion.reduce((s, d) => s + d.valor, 0) || 1;

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex justify-end">
        <select className="rounded-lg border border-line bg-panel-2 px-3 py-2 text-[12.5px] text-text-2 outline-none" value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
          {PERIODOS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-7 rounded-2xl border border-gold-dim bg-panel p-7">
        <div className="mb-2.5 flex items-center gap-2 text-[10px] font-bold tracking-[0.2em] text-gold uppercase">
          <span className="h-px w-5 bg-gold opacity-50" />
          Patrimonio Neto Total
        </div>
        <div className={`text-5xl font-bold tracking-tight ${neto < 0 ? "text-bad" : "text-gold"}`}>{fmtEUR(neto)}</div>
        <div className="mt-3.5 flex flex-wrap gap-5 border-t border-line-soft pt-3.5 text-[11px] text-text-dim">
          <span>
            ↗ Inv. <b className="text-text-2">{fmtEUR(totalInv)}</b>
          </span>
          <span>
            ₿ Crypto <b className="text-text-2">{fmtEUR(totalCry)}</b>
          </span>
          <span>
            ◎ Ahorro <b className="text-text-2">{fmtEUR(totalObj)}</b>
          </span>
          <span>
            ⊖ Deudas <b className="text-text-2">−{fmtEUR(totalDeuda)}</b>
          </span>
        </div>
      </div>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3.5">
        <MetricCard label="Inversiones" value={fmtEUR(totalInv)} color="gold" sub="Acciones / ETFs / Fondos" />
        <MetricCard label="Crypto" value={fmtEUR(totalCry)} color="amber" sub="Portfolio crypto" />
        <MetricCard label="Ahorro acumulado" value={fmtEUR(totalObj)} color="green" sub="Objetivos activos" />
        <MetricCard label="Deuda pendiente" value={fmtEUR(totalDeuda)} color="red" sub="Total a amortizar" />
        <MetricCard label="Ingreso recurrente del negocio" value={fmtEUR(mrrCoaching)} color="gold" sub="MRR de Coaching" />
      </div>

      <div className="mb-7 rounded-2xl border border-line-soft bg-panel p-5">
        <div className="mb-3.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">Distribución del patrimonio</div>
        <div className="flex h-3 overflow-hidden rounded-full bg-panel-3">
          {distribucion.map((d, i) => (
            <div key={d.label} className={COLORES_DISTRIBUCION[i]} style={{ width: `${(d.valor / totalDistribucion) * 100}%` }} />
          ))}
        </div>
        <div className="mt-3 flex flex-wrap gap-4">
          {distribucion.map((d, i) => (
            <div key={d.label} className="flex items-center gap-1.5 text-[11px] text-text-dim">
              <span className={`h-2 w-2 rounded-sm ${COLORES_DISTRIBUCION[i]}`} />
              {d.label} {Math.round((d.valor / totalDistribucion) * 100)}%
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-line-soft bg-panel p-5">
        <div className="mb-3.5 text-[11px] font-semibold tracking-wide text-text-dim uppercase">Flujo del período</div>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3.5">
          <MetricCard label="Ingresos del período" value={fmtEUR(ingresos)} color="green" />
          <MetricCard label="Gastos del período" value={fmtEUR(gastos)} color="red" />
          <MetricCard label="Balance" value={fmtEUR(ingresos - gastos)} color={ingresos - gastos >= 0 ? "green" : "red"} />
        </div>
      </div>
    </div>
  );
}
