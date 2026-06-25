"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { GoalVM } from "@/lib/personal/goal";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function NorteModal({
  open,
  onClose,
  goal,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  goal: GoalVM;
  pending: boolean;
  onSubmit: (current: number, target: number, pricePerClient: number) => void;
}) {
  const [current, setCurrent] = useState(String(goal.current));
  const [target, setTarget] = useState(String(goal.target || 5000));
  const [price, setPrice] = useState(String(goal.pricePerClient || 115));

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(Number(current) || 0, Number(target) || 5000, Number(price) || 115);
  }

  return (
    <Modal open={open} onClose={onClose} title="Actualizar el Norte">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Ingresos actuales (€/mes)</label>
          <input type="number" min={0} className={inputClass} value={current} onChange={(e) => setCurrent(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Objetivo (€/mes)</label>
          <input type="number" min={0} className={inputClass} value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Precio medio por cliente (€/mes)</label>
          <input type="number" min={0} className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
