"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { todayISO } from "@/lib/personal/format";
import {
  FUENTE_LIST, FUENTE_LABEL, FORMATO_LIST, FORMATO_LABEL, ESTADO_LABEL, ESTADO_ACCENT,
  siguienteEstado,
  type ContenidoIdeaVM, type ContenidoFuente, type ContenidoFormato,
} from "@/lib/coaching/contenido-ideas";
import type { IdeaEditInput } from "@/lib/coaching/contenido-ideas-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function IdeaEditarModal({
  open, onClose, item, pending,
  onSave, onAvanzar, onDescartar, onEliminar,
}: {
  open: boolean;
  onClose: () => void;
  item: ContenidoIdeaVM | null;
  pending: boolean;
  onSave: (input: IdeaEditInput) => void;
  onAvanzar: (nuevoEstado: string, extra?: { urlPublicado?: string; fechaPublicacion?: string }) => void;
  onDescartar: () => void;
  onEliminar: () => void;
}) {
  const [titulo, setTitulo]                 = useState(item?.titulo ?? "");
  const [descripcion, setDescripcion]       = useState(item?.descripcion ?? "");
  const [fuente, setFuente]                 = useState<ContenidoFuente | "">(item?.fuente ?? "");
  const [formato, setFormato]               = useState<ContenidoFormato | "">(item?.formato ?? "");
  const [semanaAsignada, setSemanaAsignada] = useState(item?.semanaAsignada ?? "");
  const [fechaPublicacion, setFechaPublicacion] = useState(item?.fechaPublicacion ?? "");
  const [urlPublicado, setUrlPublicado]     = useState(item?.urlPublicado ?? "");
  const [notas, setNotas]                   = useState(item?.notas ?? "");
  const [confirmEliminar, setConfirmEliminar] = useState(false);

  if (!open || !item) return null;

  const siguiente = siguienteEstado(item.estado);
  const avanzarAPublicado = siguiente === "publicado";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    onSave({ titulo: titulo.trim(), descripcion, fuente, formato, semanaAsignada, fechaPublicacion, urlPublicado, notas });
  }

  function handleAvanzar() {
    if (!siguiente) return;
    if (avanzarAPublicado) {
      if (!urlPublicado.trim()) return;
      onAvanzar(siguiente, { urlPublicado: urlPublicado.trim(), fechaPublicacion: fechaPublicacion || todayISO() });
    } else {
      onAvanzar(siguiente);
    }
  }

  function handleEliminar() {
    if (!confirmEliminar) { setConfirmEliminar(true); return; }
    onEliminar();
  }

  return (
    <Modal open={open} onClose={onClose} title="Editar idea" widthClassName="w-[520px]">
      <div className="mb-4 flex items-center gap-2">
        <span
          className="rounded-md px-2.5 py-1 text-[10px] font-semibold tracking-[0.16em] uppercase"
          style={{ backgroundColor: `${ESTADO_ACCENT[item.estado]}22`, color: ESTADO_ACCENT[item.estado] }}
        >
          {ESTADO_LABEL[item.estado]}
        </span>
        {siguiente && (
          <button
            type="button"
            disabled={pending || (avanzarAPublicado && !urlPublicado.trim())}
            onClick={handleAvanzar}
            className="ml-auto rounded-lg bg-gold px-3.5 py-1.5 text-[12px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
          >
            Avanzar a {ESTADO_LABEL[siguiente]} →
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Título</label>
          <input className={inputClass} value={titulo} onChange={(e) => setTitulo(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Descripción</label>
          <textarea rows={2} className={inputClass} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
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
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Semana (lunes)</label>
            <input type="date" className={inputClass} value={semanaAsignada} onChange={(e) => setSemanaAsignada(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">
              {item.estado === "publicado" ? "Fecha de publicación" : "Día objetivo"}
            </label>
            <input type="date" className={inputClass} value={fechaPublicacion} onChange={(e) => setFechaPublicacion(e.target.value)} />
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">
            URL publicado {avanzarAPublicado && <span className="normal-case font-normal tracking-normal text-gold-dim">— necesaria para avanzar a Publicado</span>}
          </label>
          <input className={inputClass} value={urlPublicado} onChange={(e) => setUrlPublicado(e.target.value)} placeholder="https://instagram.com/p/…" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Notas</label>
          <textarea rows={2} className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
        </div>

        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cerrar
          </button>
          <button type="submit" disabled={pending || !titulo.trim()} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar cambios
          </button>
        </div>
        <div className="mt-2.5 flex gap-2.5">
          {item.estado !== "descartado" && (
            <button type="button" disabled={pending} onClick={onDescartar} className="flex-1 rounded-lg bg-panel-3 py-2 text-[12.5px] font-semibold text-text-dim hover:text-foreground">
              Descartar
            </button>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={handleEliminar}
            className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition ${
              confirmEliminar ? "bg-red-600/20 text-red-400 hover:bg-red-600/30" : "bg-bad-bg text-bad hover:bg-[rgba(217,98,74,.2)]"
            }`}
          >
            {confirmEliminar ? "¿Seguro? Pulsa de nuevo" : "Eliminar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
