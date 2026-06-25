"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { KnCategoryVM, KnNoteVM } from "@/lib/personal/knowledge";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function NotaModal({
  open,
  onClose,
  nota,
  categorias,
  categoriaPorDefecto,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  nota: KnNoteVM | null;
  categorias: KnCategoryVM[];
  categoriaPorDefecto: string | null;
  pending: boolean;
  onSubmit: (title: string, text: string, source: string, categoryId: string | null) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(nota?.title ?? "");
  const [text, setText] = useState(nota?.text ?? "");
  const [source, setSource] = useState(nota?.source ?? "");
  const [categoryId, setCategoryId] = useState(nota?.categoryId ?? categoriaPorDefecto ?? "");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(title.trim(), text.trim(), source.trim(), categoryId || null);
  }

  return (
    <Modal open={open} onClose={onClose} title={nota ? "Editar nota" : "Nueva nota"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Título</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Contenido</label>
          <textarea rows={4} className={inputClass} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Categoría</label>
            <select className={inputClass} value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fuente (opcional)</label>
            <input className={inputClass} value={source} onChange={(e) => setSource(e.target.value)} />
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
        {nota && onDelete && (
          <button type="button" onClick={onDelete} className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Eliminar nota
          </button>
        )}
      </form>
    </Modal>
  );
}
