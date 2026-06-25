"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FRONTS, FRONT_LABEL, type Front } from "@/lib/personal/constants";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function IdeaModal({
  open,
  onClose,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onSubmit: (text: string, front: Front) => void;
}) {
  const [text, setText] = useState("");
  const [front, setFront] = useState<Front>("coaching");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onSubmit(text.trim(), front);
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva idea">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Idea</label>
          <textarea rows={3} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Frente</label>
          <select className={inputClass} value={front} onChange={(e) => setFront(e.target.value as Front)}>
            {FRONTS.map((f) => (
              <option key={f} value={f}>
                {FRONT_LABEL[f]}
              </option>
            ))}
          </select>
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
