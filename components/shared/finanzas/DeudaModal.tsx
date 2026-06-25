"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { DEBT_TIPOS } from "@/lib/personal/finanzas-constants";
import type { DeudaInput } from "@/lib/personal/finanzas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function DeudaModal({ open, onClose, pending, onSubmit }: { open: boolean; onClose: () => void; pending: boolean; onSubmit: (input: DeudaInput) => void }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<string>(DEBT_TIPOS[0]);
  const [total, setTotal] = useState("");
  const [pendiente, setPendiente] = useState("");
  const [cuota, setCuota] = useState("");
  const [interes, setInteres] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = Number(total);
    if (!nombre.trim() || !t) return;
    onSubmit({ nombre: nombre.trim(), tipo, total: t, pendiente: Number(pendiente) || 0, cuota: Number(cuota) || 0, interes: Number(interes) || 0 });
  }

  return (
    <Modal open={open} onClose={onClose} title="Deuda / Préstamo">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Hipoteca, préstamo…" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Tipo</label>
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {DEBT_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Importe original (€)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={total} onChange={(e) => setTotal(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Pendiente (€)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={pendiente} onChange={(e) => setPendiente(e.target.value)} />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Cuota mensual (€)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={cuota} onChange={(e) => setCuota(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Interés anual (%)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={interes} onChange={(e) => setInteres(e.target.value)} />
          </div>
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
