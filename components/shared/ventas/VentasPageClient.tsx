"use client";

import { useState, useTransition } from "react";
import { FASE_LLAMADA_LABEL } from "@/lib/coaching/ventas-constants";
import type { LlamadaVM } from "@/lib/coaching/ventas";
import { crearLlamada, eliminarLlamada, type LlamadaInput } from "@/lib/coaching/ventas-actions";
import type { Lead } from "@/lib/coaching/leads";
import { LlamadaModal } from "./LlamadaModal";
import { GuionViewer } from "./GuionViewer";

export function VentasPageClient({ llamadas, leads }: { llamadas: LlamadaVM[]; leads: Lead[] }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Registro de llamadas
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">{llamadas.length}</span>
        <span className="h-px flex-1 bg-line" />
        <button type="button" onClick={() => setModalOpen(true)} className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright">
          + Registrar llamada
        </button>
      </div>

      <div className="mb-10 overflow-hidden rounded-2xl border border-line-soft bg-panel">
        {llamadas.length === 0 ? (
          <p className="px-4 py-9 text-center text-text-dim">Sin llamadas registradas todavía.</p>
        ) : (
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-panel-2">
                {["Lead", "Fecha", "Fase alcanzada", "Resultado", "Notas"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[10px] tracking-wide text-text-dim uppercase">
                    {h}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {llamadas.map((l) => (
                <tr key={l.id} className="border-t border-line-soft">
                  <td className="px-4 py-2.5 font-semibold">{l.leadNombre ?? "—"}</td>
                  <td className="px-4 py-2.5 text-text-dim">{new Date(l.fecha).toLocaleDateString("es-ES")}</td>
                  <td className="px-4 py-2.5">
                    {l.faseAlcanzada ? <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[11px] text-gold-bright">{FASE_LLAMADA_LABEL[l.faseAlcanzada]}</span> : "—"}
                  </td>
                  <td className="px-4 py-2.5 text-text-2">{l.resultado ?? "—"}</td>
                  <td className="max-w-[220px] truncate px-4 py-2.5 text-text-2">{l.notas ?? "—"}</td>
                  <td className="px-4 py-2.5 text-right">
                    <button type="button" onClick={() => run(() => eliminarLlamada(l.id))} className="text-text-dim hover:text-bad">
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Guion de la llamada
        <span className="h-px flex-1 bg-line" />
      </div>
      <GuionViewer />

      <LlamadaModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        leads={leads}
        pending={pending}
        onSubmit={(input: LlamadaInput) => run(() => crearLlamada(input), () => setModalOpen(false))}
      />
    </div>
  );
}
