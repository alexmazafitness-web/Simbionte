"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { INV_TIPOS } from "@/lib/personal/finanzas-constants";
import { todayISO } from "@/lib/personal/format";
import type { InversionInput } from "@/lib/personal/finanzas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function InversionModal({ open, onClose, pending, onSubmit }: { open: boolean; onClose: () => void; pending: boolean; onSubmit: (input: InversionInput) => void }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<string>(INV_TIPOS[0]);
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioActual, setPrecioActual] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [fecha, setFecha] = useState(todayISO());

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pc = Number(precioCompra);
    if (!nombre.trim() || !pc) return;
    onSubmit({ nombre: nombre.trim(), tipo, precioCompra: pc, precioActual: Number(precioActual) || 0, cantidad: Number(cantidad) || 1, fecha });
  }

  return (
    <Modal open={open} onClose={onClose} title="Posición de inversión">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Ticker / Nombre</label>
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="MSCI World, S&P500…" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Tipo</label>
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {INV_TIPOS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Precio compra (€)</label>
            <input type="number" min={0} step="any" className={inputClass} value={precioCompra} onChange={(e) => setPrecioCompra(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Precio actual (€)</label>
            <input type="number" min={0} step="any" className={inputClass} value={precioActual} onChange={(e) => setPrecioActual(e.target.value)} placeholder="= precio compra si se deja vacío" />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Cantidad</label>
            <input type="number" min={0} step="any" className={inputClass} value={cantidad} onChange={(e) => setCantidad(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha compra</label>
            <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
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
