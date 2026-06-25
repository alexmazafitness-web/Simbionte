"use client";

import { useState, useTransition } from "react";
import type { GoalVM } from "@/lib/personal/goal";
import { actualizarNorte } from "@/lib/personal/goal-actions";
import { guardarPalanca } from "@/lib/personal/meta-actions";
import { PALANCA_OPCIONES } from "@/lib/personal/meta";
import { NorteModal } from "./NorteModal";

export function NortePageClient({ goal, palanca }: { goal: GoalVM; palanca: string }) {
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;
  const gap = Math.max(0, goal.target - goal.current);
  const clientesFaltan = goal.pricePerClient > 0 ? Math.ceil(gap / goal.pricePerClient) : null;

  const hist = goal.history.length ? goal.history : [{ value: goal.current, recordedAt: "" }];
  const max = Math.max(goal.target, ...hist.map((h) => h.value), 1);
  const barras = hist.slice(-14);

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="rounded-2xl border border-line-soft bg-panel p-6">
        <div className="flex items-end justify-between">
          <div>
            <div className="font-display text-5xl leading-none text-gold">{goal.current.toLocaleString("es-ES")}€</div>
            <div className="mt-1 text-[12.5px] text-text-dim">de {goal.target.toLocaleString("es-ES")}€ objetivo</div>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="rounded-lg bg-panel-2 px-4 py-2.5 text-[12.5px] font-semibold text-gold-bright hover:bg-[rgba(201,169,110,.14)]"
          >
            Actualizar
          </button>
        </div>

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-panel-3">
          <div className="h-full rounded-full bg-gradient-to-r from-[#9a7c47] to-gold" style={{ width: `${pct}%` }} />
        </div>

        <p className="mt-3.5 text-[13px] text-text-2">
          {pct >= 100 ? (
            <>
              Objetivo alcanzado. Si se mantiene 2 meses: <b className="text-gold">dejas la empresa.</b>
            </>
          ) : (
            <>
              Faltan <b className="text-text-2">{gap.toLocaleString("es-ES")}€</b> para liberarte del trabajo corporativo.
            </>
          )}
        </p>
        {clientesFaltan !== null && pct < 100 && (
          <p className="mt-1 text-[11.5px] text-text-dim">≈ +{clientesFaltan} clientes al precio medio actual.</p>
        )}

        <div className="mt-6 flex h-20 items-end gap-1.5 border-t border-line-soft pt-4">
          {barras.map((h, i) => (
            <div
              key={i}
              title={`${h.value}€`}
              className={`flex-1 rounded-t ${i === barras.length - 1 ? "bg-gold" : "bg-panel-3"}`}
              style={{ height: `${Math.max(4, Math.round((h.value / max) * 100))}%` }}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-line-soft bg-panel p-6">
        <div className="mb-3 text-[10px] tracking-[0.2em] text-gold-dim uppercase">La palanca de la semana</div>
        <div className="flex flex-wrap gap-2">
          {PALANCA_OPCIONES.map((opcion) => (
            <button
              key={opcion}
              type="button"
              disabled={pending}
              onClick={() => run(() => guardarPalanca(opcion))}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
                palanca === opcion ? "border-gold bg-gold font-semibold text-[#1a1208]" : "border-line text-text-2 hover:border-gold-dim"
              }`}
            >
              {opcion}
            </button>
          ))}
        </div>
      </div>

      <NorteModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        goal={goal}
        pending={pending}
        onSubmit={(current, target, price) => run(() => actualizarNorte(current, target, price), () => setModalOpen(false))}
      />
    </div>
  );
}
