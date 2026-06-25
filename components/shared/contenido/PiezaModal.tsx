"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ESTADOS_PIEZA, ESTADO_PIEZA_LABEL, TIPOS_PIEZA, TIPO_PIEZA_LABEL } from "@/lib/coaching/contenido-constants";
import { todayISO } from "@/lib/personal/format";
import type { PiezaVM } from "@/lib/coaching/contenido";
import type { PiezaInput } from "@/lib/coaching/contenido-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function PiezaModal({
  open,
  onClose,
  pieza,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  pieza: PiezaVM | null;
  pending: boolean;
  onSubmit: (input: PiezaInput) => void;
  onDelete?: () => void;
}) {
  const [titulo, setTitulo] = useState(pieza?.titulo ?? "");
  const [tipo, setTipo] = useState(pieza?.tipo ?? TIPOS_PIEZA[0]);
  const [estado, setEstado] = useState(pieza?.estado ?? ESTADOS_PIEZA[0]);
  const [fecha, setFecha] = useState(pieza?.fechaPublicacion ?? todayISO());
  const [url, setUrl] = useState(pieza?.url ?? "");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({ titulo: titulo.trim(), tipo, estado, fechaPublicacion: fecha, url: url.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title={pieza ? "Editar pieza" : "Nueva pieza"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Título / idea</label>
          <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus placeholder='Ej: "Llevas años entrenando y no avanzas"' />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Formato</label>
            <select className={inputClass} value={tipo} onChange={(e) => setTipo(e.target.value as (typeof TIPOS_PIEZA)[number])}>
              {TIPOS_PIEZA.map((t) => (
                <option key={t} value={t}>
                  {TIPO_PIEZA_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Estado</label>
            <select className={inputClass} value={estado} onChange={(e) => setEstado(e.target.value as (typeof ESTADOS_PIEZA)[number])}>
              {ESTADOS_PIEZA.map((e) => (
                <option key={e} value={e}>
                  {ESTADO_PIEZA_LABEL[e]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha de publicación</label>
          <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">URL (opcional)</label>
          <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://instagram.com/p/…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
        {pieza && onDelete && (
          <button type="button" onClick={onDelete} className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Eliminar
          </button>
        )}
      </form>
    </Modal>
  );
}
