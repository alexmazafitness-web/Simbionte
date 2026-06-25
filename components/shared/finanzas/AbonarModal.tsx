"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function AbonarModal({ open, onClose, nombre, pending, onSubmit }: { open: boolean; onClose: () => void; nombre: string; pending: boolean; onSubmit: (importe: number) => void }) {
  const [importe, setImporte] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(importe);
    if (!valor || valor <= 0) return;
    onSubmit(valor);
    setImporte("");
  }

  return (
    <Modal open={open} onClose={onClose} title={`Abonar a ${nombre}`}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">¿Cuánto quieres abonar? (€)</label>
          <input type="number" min={0} step="0.01" className={inputClass} value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Abonar
          </button>
        </div>
      </form>
    </Modal>
  );
}
