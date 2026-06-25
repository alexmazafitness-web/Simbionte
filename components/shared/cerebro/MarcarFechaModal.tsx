"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { todayISO } from "@/lib/personal/format";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function MarcarFechaModal({
  open,
  onClose,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onSubmit: (date: string, note: string) => void;
}) {
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    onSubmit(date, note.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title="Marcar fecha">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha</label>
          <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nota / motivo</label>
          <textarea rows={2} className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej: Salida de la empresa, lanzamiento…" />
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
