"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CATEGORIA_LIST, type CredencialVM, type CredencialCategoria } from "@/lib/personal/credenciales";
import type { CredencialInput } from "@/lib/personal/credenciales-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function CredencialModal({
  open,
  onClose,
  item,
  categoriaPorDefecto,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  item: CredencialVM | null;
  categoriaPorDefecto: CredencialCategoria;
  pending: boolean;
  onSubmit: (input: CredencialInput) => void;
  onDelete?: () => void;
}) {
  const [nombre, setNombre]           = useState(item?.nombre ?? "");
  const [categoria, setCategoria]     = useState<CredencialCategoria>(item?.categoria ?? categoriaPorDefecto);
  const [servicio, setServicio]       = useState(item?.servicio ?? "");
  const [valor, setValor]             = useState(""); // siempre vacío: nunca se prefill con el valor descifrado
  const [descripcion, setDescripcion] = useState(item?.descripcion ?? "");
  const [url, setUrl]                 = useState(item?.url ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!open) return null;

  const puedeGuardar = nombre.trim() && (item ? true : valor.trim());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!puedeGuardar) return;
    onSubmit({ nombre: nombre.trim(), categoria, servicio, valor, descripcion, url });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    onDelete?.();
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? "Editar credencial" : "Nueva credencial"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus placeholder="Ej: Anthropic API Key" />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Categoría</label>
            <select className={inputClass} value={categoria} onChange={(e) => setCategoria(e.target.value as CredencialCategoria)}>
              {CATEGORIA_LIST.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Servicio</label>
            <input className={inputClass} value={servicio} onChange={(e) => setServicio(e.target.value)} placeholder="Ej: Anthropic" />
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">
            Valor {item && <span className="normal-case font-normal tracking-normal text-text-dim">— déjalo vacío para no cambiarlo</span>}
          </label>
          <input
            type="password"
            className={inputClass}
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder={item ? "••••••••••" : "Pega aquí el valor a proteger"}
            autoComplete="new-password"
          />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Descripción (opcional)</label>
          <input className={inputClass} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Notas, para qué sirve…" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">URL (opcional)</label>
          <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending || !puedeGuardar} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
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
            {confirmDelete ? "¿Seguro? Pulsa de nuevo para eliminar" : "Eliminar credencial"}
          </button>
        )}
      </form>
    </Modal>
  );
}
