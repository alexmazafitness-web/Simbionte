"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function CategoriaModal({
  open,
  onClose,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onSubmit: (emoji: string, name: string) => void;
}) {
  const [emoji, setEmoji] = useState("📁");
  const [name, setName] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(emoji.trim() || "📁", name.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva categoría">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5 grid grid-cols-[70px_1fr] gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Emoji</label>
            <input maxLength={2} className={`${inputClass} text-center`} value={emoji} onChange={(e) => setEmoji(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
            <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ej: Finanzas personales" />
          </div>
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Crear
          </button>
        </div>
      </form>
    </Modal>
  );
}
