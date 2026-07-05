"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FUENTE_LIST, FUENTE_LABEL, FORMATO_LIST, FORMATO_LABEL, type ContenidoFuente, type ContenidoFormato } from "@/lib/coaching/contenido-ideas";
import type { IdeaCompletaInput } from "@/lib/coaching/contenido-ideas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function IdeaCompletaModal({
  open, onClose, pending, onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onSubmit: (input: IdeaCompletaInput) => void;
}) {
  const [titulo, setTitulo]           = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fuente, setFuente]           = useState<ContenidoFuente | "">("");
  const [formato, setFormato]         = useState<ContenidoFormato | "">("");
  const [notas, setNotas]             = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSubmit({ titulo: titulo.trim(), descripcion, fuente, formato, notas });
  }

  return (
    <Modal open={open} onClose={onClose} title="Idea completa">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Título</label>
          <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus placeholder="¿Qué idea tienes?" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Descripción (opcional)</label>
          <textarea rows={2} className={inputClass} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Ángulo, por qué ahora, qué quieres transmitir…" />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fuente</label>
            <select className={inputClass} value={fuente} onChange={(e) => setFuente(e.target.value as ContenidoFuente | "")}>
              <option value="">Sin especificar</option>
              {FUENTE_LIST.map((f) => <option key={f} value={f}>{FUENTE_LABEL[f]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Formato</label>
            <select className={inputClass} value={formato} onChange={(e) => setFormato(e.target.value as ContenidoFormato | "")}>
              <option value="">Sin especificar</option>
              {FORMATO_LIST.map((f) => <option key={f} value={f}>{FORMATO_LABEL[f]}</option>)}
            </select>
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Notas (opcional)</label>
          <textarea rows={2} className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Cualquier detalle adicional…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending || !titulo.trim()} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
