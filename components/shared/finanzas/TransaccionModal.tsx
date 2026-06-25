"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CAT_GASTOS, CAT_INGRESOS } from "@/lib/personal/finanzas-constants";
import { todayISO } from "@/lib/personal/format";
import type { TipoTransaccion } from "@/lib/personal/finanzas";
import type { TransaccionInput } from "@/lib/personal/finanzas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function TransaccionModal({
  open,
  onClose,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onSubmit: (input: TransaccionInput) => void;
}) {
  const [tipo, setTipo] = useState<TipoTransaccion>("gasto");
  const categorias = tipo === "gasto" ? CAT_GASTOS : CAT_INGRESOS;
  const [importe, setImporte] = useState("");
  const [fecha, setFecha] = useState(todayISO());
  const [categoria, setCategoria] = useState(categorias[0]);
  const [descripcion, setDescripcion] = useState("");

  if (!open) return null;

  function handleTipoChange(nuevoTipo: TipoTransaccion) {
    setTipo(nuevoTipo);
    setCategoria((nuevoTipo === "gasto" ? CAT_GASTOS : CAT_INGRESOS)[0]);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const valor = Number(importe);
    if (!valor || !fecha) return;
    onSubmit({ tipo, importe: valor, fecha, categoria, descripcion: descripcion.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva transacción">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Tipo</label>
          <select className={inputClass} value={tipo} onChange={(e) => handleTipoChange(e.target.value as TipoTransaccion)}>
            <option value="ingreso">Ingreso</option>
            <option value="gasto">Gasto</option>
          </select>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Importe (€)</label>
            <input type="number" min={0} step="0.01" className={inputClass} value={importe} onChange={(e) => setImporte(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha</label>
            <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Categoría</label>
          <select className={inputClass} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Descripción</label>
          <input className={inputClass} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Descripción opcional" />
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
