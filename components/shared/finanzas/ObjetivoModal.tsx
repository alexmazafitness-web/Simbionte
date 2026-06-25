"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { OBJ_EMOJIS } from "@/lib/personal/finanzas-constants";
import { todayISO } from "@/lib/personal/format";
import type { ObjetivoInput } from "@/lib/personal/finanzas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function ObjetivoModal({ open, onClose, pending, onSubmit }: { open: boolean; onClose: () => void; pending: boolean; onSubmit: (input: ObjetivoInput) => void }) {
  const [nombre, setNombre] = useState("");
  const [meta, setMeta] = useState("");
  const [actual, setActual] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [emoji, setEmoji] = useState(OBJ_EMOJIS[0].value);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const m = Number(meta);
    if (!nombre.trim() || !m) return;
    onSubmit({ nombre: nombre.trim(), meta: m, actual: Number(actual) || 0, fecha, emoji });
  }

  return (
    <Modal open={open} onClose={onClose} title="Objetivo de ahorro">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre del objetivo</label>
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Fondo de emergencia, viaje, coche…" />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Meta (€)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={meta} onChange={(e) => setMeta(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Ahorrado (€)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={actual} onChange={(e) => setActual(e.target.value)} />
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha objetivo</label>
            <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Icono</label>
            <select className={inputClass} value={emoji} onChange={(e) => setEmoji(e.target.value)}>
              {OBJ_EMOJIS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
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
