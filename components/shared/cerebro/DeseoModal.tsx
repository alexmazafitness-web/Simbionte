"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { PRIORIDAD_LIST, PRIORIDAD_LABEL, type DeseoVM, type DeseoCategoriaVM, type DeseoPrioridad } from "@/lib/personal/deseos";
import type { DeseoInput } from "@/lib/personal/deseos-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function DeseoModal({
  open,
  onClose,
  item,
  categorias,
  categoriaPorDefecto,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  item: DeseoVM | null;
  categorias: DeseoCategoriaVM[];
  categoriaPorDefecto: string | null;
  pending: boolean;
  onSubmit: (input: DeseoInput) => void;
  onDelete?: () => void;
}) {
  const [nombre, setNombre]         = useState(item?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState<string | null>(item?.categoriaId ?? categoriaPorDefecto);
  const [precio, setPrecio]         = useState(item?.precio != null ? String(item.precio) : "");
  const [link, setLink]             = useState(item?.link ?? "");
  const [prioridad, setPrioridad]   = useState<DeseoPrioridad>(item?.prioridad ?? "media");
  const [notas, setNotas]           = useState(item?.notas ?? "");
  const [imagenUrl, setImagenUrl]   = useState(item?.imagenUrl ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSubmit({ nombre: nombre.trim(), categoriaId, precio, link, prioridad, notas, imagenUrl });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? "Editar deseo" : "Nuevo deseo"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Ej: Auriculares Sony WH-1000XM5" />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Categoría</label>
            <select className={inputClass} value={categoriaId ?? ""} onChange={(e) => setCategoriaId(e.target.value || null)}>
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Prioridad</label>
            <select className={inputClass} value={prioridad} onChange={(e) => setPrioridad(e.target.value as DeseoPrioridad)}>
              {PRIORIDAD_LIST.map((p) => (
                <option key={p} value={p}>{PRIORIDAD_LABEL[p]}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Precio (opcional)</label>
            <input className={inputClass} value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 349,99" inputMode="decimal" />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Link (opcional)</label>
            <input className={inputClass} value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" />
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Imagen — URL (opcional)</label>
          <input className={inputClass} value={imagenUrl} onChange={(e) => setImagenUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Notas (opcional)</label>
          <textarea rows={2} className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Talla, color, dónde lo vi…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending || !nombre.trim()} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
        {item && onDelete && (
          <button
            type="button"
            disabled={pending}
            onClick={handleDelete}
            className={`mt-2.5 w-full rounded-lg py-2.5 text-[13.5px] font-semibold transition ${
              confirmDelete ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "bg-bad-bg text-bad hover:bg-[rgba(217,98,74,.2)]"
            }`}
          >
            {confirmDelete ? "¿Seguro? Pulsa de nuevo para eliminar" : "Eliminar deseo"}
          </button>
        )}
      </form>
    </Modal>
  );
}
