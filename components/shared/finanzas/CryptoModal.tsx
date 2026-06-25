"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { todayISO } from "@/lib/personal/format";
import type { CryptoInput } from "@/lib/personal/finanzas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function CryptoModal({ open, onClose, pending, onSubmit }: { open: boolean; onClose: () => void; pending: boolean; onSubmit: (input: CryptoInput) => void }) {
  const [nombre, setNombre] = useState("");
  const [simbolo, setSimbolo] = useState("");
  const [precioCompra, setPrecioCompra] = useState("");
  const [precioActual, setPrecioActual] = useState("");
  const [cantidad, setCantidad] = useState("");
  const [fecha, setFecha] = useState(todayISO());

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const pc = Number(precioCompra);
    if (!nombre.trim() || !pc) return;
    onSubmit({ nombre: nombre.trim(), simbolo: simbolo.trim(), precioCompra: pc, precioActual: Number(precioActual) || 0, cantidad: Number(cantidad) || 0, fecha });
  }

  return (
    <Modal open={open} onClose={onClose} title="Posición crypto">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
            <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Bitcoin, Ethereum…" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Símbolo</label>
            <input className={inputClass} value={simbolo} onChange={(e) => setSimbolo(e.target.value)} placeholder="BTC, ETH…" />
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
