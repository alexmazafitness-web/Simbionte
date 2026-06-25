"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { KnPrincipleVM } from "@/lib/personal/knowledge";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function PrincipioModal({
  open,
  onClose,
  principio,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  principio: KnPrincipleVM | null;
  pending: boolean;
  onSubmit: (text: string, source: string) => void;
  onDelete?: () => void;
}) {
  const [text, setText] = useState(principio?.text ?? "");
  const [source, setSource] = useState(principio?.source ?? "");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim(), source.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title="Principio maestro">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">El principio</label>
          <textarea rows={2} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} autoFocus placeholder="Ej: La consistencia supera a la intensidad." />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fuente (opcional)</label>
          <input className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} placeholder="Ej: Atomic Habits, experiencia propia…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
        {principio && onDelete && (
          <button type="button" onClick={onDelete} className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Eliminar
          </button>
        )}
      </form>
    </Modal>
  );
}
