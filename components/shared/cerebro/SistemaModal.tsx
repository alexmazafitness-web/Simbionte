"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { KnSystemVM } from "@/lib/personal/knowledge";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function SistemaModal({
  open,
  onClose,
  sistema,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  sistema: KnSystemVM | null;
  pending: boolean;
  onSubmit: (name: string, desc: string) => void;
  onDelete?: () => void;
}) {
  const [name, setName] = useState(sistema?.name ?? "");
  const [desc, setDesc] = useState(sistema?.desc ?? "");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit(name.trim(), desc.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title="Sistema">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre del sistema</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ej: Sistema de ventas" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Proceso / descripción</label>
          <textarea rows={4} className={inputClass} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Pasos, framework o metodología…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
        {sistema && onDelete && (
          <button type="button" onClick={onDelete} className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Eliminar
          </button>
        )}
      </form>
    </Modal>
  );
}
