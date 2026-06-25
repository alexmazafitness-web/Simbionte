"use client";

import { useState, useTransition } from "react";
import { diffDiasDesdeHoy } from "@/lib/personal/format";
import { fmtEUR, pctObjetivo, type ObjetivoVM } from "@/lib/personal/finanzas";
import { abonarObjetivo, crearObjetivo, eliminarObjetivo, type ObjetivoInput } from "@/lib/personal/finanzas-actions";
import { MetricCard } from "./MetricCard";
import { ObjetivoModal } from "./ObjetivoModal";
import { AbonarModal } from "./AbonarModal";

export function AhorroPageClient({ objetivos }: { objetivos: ObjetivoVM[] }) {
  const [modalNuevo, setModalNuevo] = useState(false);
  const [abonando, setAbonando] = useState<ObjetivoVM | null>(null);
  const [pending, startTransition] = useTransition();

  const metaTotal = objetivos.reduce((s, o) => s + o.meta, 0);
  const ahorrado = objetivos.reduce((s, o) => s + o.actual, 0);
  const completados = objetivos.filter((o) => o.actual >= o.meta).length;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex justify-end">
        <button type="button" onClick={() => setModalNuevo(true)} className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright">
          + Nuevo objetivo
        </button>
      </div>

      <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(155px,1fr))] gap-3.5">
        <MetricCard label="Objetivos activos" value={String(objetivos.length)} color="gold" />
        <MetricCard label="Completados" value={String(completados)} color="green" />
        <MetricCard label="Ahorrado" value={fmtEUR(ahorrado)} color="green" />
        <MetricCard label="Meta total" value={fmtEUR(metaTotal)} />
      </div>

      {objetivos.length === 0 ? (
        <p className="py-9 text-center text-text-dim">Sin objetivos de ahorro. Crea tu primero.</p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
          {objetivos.map((o) => {
            const pct = pctObjetivo(o.meta, o.actual);
            const dias = o.fecha ? diffDiasDesdeHoy(o.fecha) : null;
            const completado = o.actual >= o.meta;
            return (
              <div key={o.id} className="rounded-2xl border border-line-soft bg-panel p-5">
                <div className="mb-2.5 text-2xl">{o.emoji}</div>
                <div className="mb-1 text-sm font-semibold">{o.nombre}</div>
                <div className="mb-2.5 text-[10px] text-text-dim">
                  {dias === null ? "" : completado ? "Completado ✓" : dias > 0 ? `${dias} días restantes` : dias === 0 ? "Vence hoy" : "Vencido"}
                </div>
                <div className="mb-1.5 flex justify-between text-[11px]">
                  <span className="text-text-dim">
                    {fmtEUR(o.actual)} / {fmtEUR(o.meta)}
                  </span>
                  <span className={`font-bold ${completado ? "text-ok" : "text-gold"}`}>{pct.toFixed(0)}%</span>
                </div>
                <div className="mb-3.5 h-1 overflow-hidden rounded-full bg-panel-3">
                  <div className={`h-full rounded-full ${completado ? "bg-ok" : "bg-gold"}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setAbonando(o)} className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-2 hover:text-foreground">
                    + Abonar
                  </button>
                  <button type="button" onClick={() => run(() => eliminarObjetivo(o.id))} className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-bad">
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ObjetivoModal open={modalNuevo} onClose={() => setModalNuevo(false)} pending={pending} onSubmit={(input: ObjetivoInput) => run(() => crearObjetivo(input), () => setModalNuevo(false))} />
      {abonando && (
        <AbonarModal
          open={!!abonando}
          onClose={() => setAbonando(null)}
          nombre={abonando.nombre}
          pending={pending}
          onSubmit={(importe) => run(() => abonarObjetivo(abonando.id, importe), () => setAbonando(null))}
        />
      )}
    </div>
  );
}
