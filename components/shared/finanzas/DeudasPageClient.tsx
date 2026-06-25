"use client";

import { useState, useTransition } from "react";
import { fmtEUR, pctAmortizado, type DeudaVM } from "@/lib/personal/finanzas";
import { crearDeuda, eliminarDeuda, type DeudaInput } from "@/lib/personal/finanzas-actions";
import { MetricCard } from "./MetricCard";
import { DeudaModal } from "./DeudaModal";

export function DeudasPageClient({ deudas }: { deudas: DeudaVM[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const totalPendiente = deudas.reduce((s, d) => s + d.pendiente, 0);
  const totalCuota = deudas.reduce((s, d) => s + d.cuota, 0);
  const totalOriginal = deudas.reduce((s, d) => s + d.total, 0);
  const pctTotal = pctAmortizado(totalOriginal, totalPendiente);

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
          + Añadir deuda
        </button>
      </div>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3.5">
        <MetricCard label="Deuda pendiente" value={fmtEUR(totalPendiente)} color="red" />
        <MetricCard label="Cuota mensual" value={fmtEUR(totalCuota)} color="red" />
        <MetricCard label="Importe original" value={fmtEUR(totalOriginal)} />
        <MetricCard label="% amortizado" value={`${pctTotal.toFixed(1)}%`} color="green" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
        {deudas.length === 0 ? (
          <p className="px-4 py-9 text-center text-text-dim">Sin deudas registradas.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-panel-2">
                {["Nombre", "Tipo", "Pendiente", "Cuota/mes", "Interés", "Amortizado"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">
                    {h}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deudas.map((d) => {
                const p = pctAmortizado(d.total, d.pendiente);
                return (
                  <tr key={d.id} className="border-t border-line-soft">
                    <td className="px-4 py-2.5 font-semibold">{d.nombre}</td>
                    <td className="px-4 py-2.5">
                      <span className="rounded-md bg-bad-bg px-2 py-0.5 text-[11px] text-bad">{d.tipo}</span>
                    </td>
                    <td className="px-4 py-2.5 text-bad">{fmtEUR(d.pendiente)}</td>
                    <td className="px-4 py-2.5 text-text-2">{fmtEUR(d.cuota)}</td>
                    <td className="px-4 py-2.5 text-text-dim">{d.interes}%</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-panel-3">
                          <div className="h-full rounded-full bg-ok" style={{ width: `${p.toFixed(0)}%` }} />
                        </div>
                        <span className="text-[10px] text-text-dim">{p.toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <button type="button" onClick={() => run(() => eliminarDeuda(d.id))} className="text-text-dim hover:text-bad">
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

      <DeudaModal open={modalOpen} onClose={() => setModalOpen(false)} pending={pending} onSubmit={(input: DeudaInput) => run(() => crearDeuda(input), () => setModalOpen(false))} />
    </div>
  );
}
