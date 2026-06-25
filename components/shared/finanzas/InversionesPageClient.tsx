"use client";

import { useState, useTransition } from "react";
import { costePosicion, fmtEUR, fmtPct, plPosicion, rentabilidadPct, valorPosicion, type InversionVM } from "@/lib/personal/finanzas";
import { crearInversion, eliminarInversion, type InversionInput } from "@/lib/personal/finanzas-actions";
import { MetricCard } from "./MetricCard";
import { InversionModal } from "./InversionModal";

export function InversionesPageClient({ inversiones }: { inversiones: InversionVM[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const valorTotal = inversiones.reduce((s, i) => s + valorPosicion(i.precioActual, i.cantidad), 0);
  const costeTotal = inversiones.reduce((s, i) => s + costePosicion(i.precioCompra, i.cantidad), 0);
  const pl = valorTotal - costeTotal;
  const plPct = costeTotal > 0 ? (pl / costeTotal) * 100 : 0;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex justify-end">
        <button type="button" onClick={() => setModalOpen(true)} className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright">
          + Añadir posición
        </button>
      </div>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3.5">
        <MetricCard label="Valor actual" value={fmtEUR(valorTotal)} color="gold" />
        <MetricCard label="Coste total" value={fmtEUR(costeTotal)} />
        <MetricCard label="P&L total" value={fmtEUR(pl, 2)} color={pl >= 0 ? "green" : "red"} />
        <MetricCard label="Rentabilidad" value={fmtPct(plPct)} color={plPct >= 0 ? "green" : "red"} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
        {inversiones.length === 0 ? (
          <p className="px-4 py-9 text-center text-text-dim">Sin posiciones. Añade tu primera inversión.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-panel-2">
                {["Activo", "Tipo", "Cant.", "Compra", "Actual", "Valor", "P&L", "Rent."].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">
                    {h}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inversiones.map((i) => {
                const valor = valorPosicion(i.precioActual, i.cantidad);
                const p = plPosicion(i.precioCompra, i.precioActual, i.cantidad);
                const r = rentabilidadPct(i.precioCompra, i.precioActual);
                return (
                  <tr key={i.id} className="border-t border-line-soft">
                    <td className="px-4 py-2.5 font-semibold">{i.nombre}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-[rgba(201,169,110,.12)] px-2 py-0.5 text-[11px] text-gold">{i.tipo}</span>
                    </td>
                    <td className="px-4 py-2.5 text-text-2">{i.cantidad}</td>
                    <td className="px-4 py-2.5 text-text-dim">{fmtEUR(i.precioCompra, 2)}</td>
                    <td className="px-4 py-2.5 text-text-2">{fmtEUR(i.precioActual, 2)}</td>
                    <td className="px-4 py-2.5 font-semibold">{fmtEUR(valor)}</td>
                    <td className={`px-4 py-2.5 ${p >= 0 ? "text-ok" : "text-bad"}`}>
                      {p >= 0 ? "+" : ""}
                      {fmtEUR(p, 2)}
                    </td>
                    <td className={`px-4 py-2.5 ${r >= 0 ? "text-ok" : "text-bad"}`}>{fmtPct(r)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => run(() => eliminarInversion(i.id))} className="text-text-dim hover:text-bad">
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <InversionModal open={modalOpen} onClose={() => setModalOpen(false)} pending={pending} onSubmit={(input: InversionInput) => run(() => crearInversion(input), () => setModalOpen(false))} />
    </div>
  );
}
