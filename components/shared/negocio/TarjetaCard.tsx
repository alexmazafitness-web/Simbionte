"use client";

import { useState } from "react";
import { ESTADO_LABEL, TIPO_TARJETA_LABEL } from "@/lib/coaching/negocio-constants";
import { estadoEfectivo, type TarjetaVM } from "@/lib/coaching/negocio";
import {
  crearSubtarea,
  editarSubtarea,
  editarTarjeta,
  eliminarSubtarea,
  eliminarTarjeta,
  toggleSubtarea,
} from "@/lib/coaching/negocio-actions";

const ESTADO_CLASS: Record<string, string> = {
  pendiente: "bg-panel-3 text-text-dim",
  curso: "bg-warn-bg text-warn",
  hecho: "bg-ok-bg text-ok",
  nodef: "bg-panel-3 text-text-dim",
};

export function TarjetaCard({ tarjeta, recienCreada }: { tarjeta: TarjetaVM; recienCreada: boolean }) {
  const [abierta, setAbierta] = useState(recienCreada);
  const [editando, setEditando] = useState(recienCreada);
  const [titulo, setTitulo] = useState(tarjeta.titulo);
  const [nota, setNota] = useState(tarjeta.nota ?? "");
  const [pending, setPending] = useState(false);

  const estado = estadoEfectivo(tarjeta);
  const subDone = tarjeta.subtareas.filter((s) => s.hecha).length;
  const subTotal = tarjeta.subtareas.length;

  async function run(action: () => Promise<unknown>) {
    setPending(true);
    await action();
    setPending(false);
  }

  if (editando) {
    return (
      <div className="rounded-xl border border-gold-dim bg-panel-3 p-4">
        <div className="mb-3">
          <label className="mb-1.5 block text-[10.5px] tracking-wide text-text-dim uppercase">Título</label>
          <input
            autoFocus
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[14px] outline-none focus:border-gold-dim"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nombre de la tarjeta"
          />
        </div>
        <div className="mb-3">
          <label className="mb-1.5 block text-[10.5px] tracking-wide text-text-dim uppercase">Descripción</label>
          <textarea
            rows={2}
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Nota, próximos pasos, contexto…"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={pending || !titulo.trim()}
            onClick={() => run(() => editarTarjeta(tarjeta.id, titulo.trim(), nota.trim())).then(() => setEditando(false))}
            className="rounded-lg bg-gold px-4 py-2 text-[12.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={() => {
              if (recienCreada && !tarjeta.titulo) run(() => eliminarTarjeta(tarjeta.id));
              setEditando(false);
            }}
            className="rounded-lg bg-panel-2 px-4 py-2 text-[12.5px] font-semibold text-text-2 hover:text-foreground"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line-soft bg-panel-2 transition hover:border-gold-dim">
      <button type="button" onClick={() => setAbierta((v) => !v)} className="flex w-full items-start gap-3.5 p-4 text-left">
        <div className="min-w-0 flex-1">
          <span className={`mb-1.5 inline-block rounded px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase ${ESTADO_CLASS[estado]}`}>
            {estado === "nodef" ? "No definido" : ESTADO_LABEL[estado]}
          </span>
          <div className="flex flex-wrap items-center gap-2 text-[15px] font-medium">
            {tarjeta.titulo || <span className="text-text-dim italic">(sin título)</span>}
            {subTotal > 0 && (
              <span className={`rounded-full border px-2 py-0.5 text-[11px] ${subDone === subTotal ? "border-ok/40 text-ok" : "border-line text-text-dim"}`}>
                {subDone}/{subTotal}
              </span>
            )}
          </div>
          {tarjeta.nota && <div className="mt-1 text-[13px] text-text-2">{tarjeta.nota}</div>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setEditando(true);
            }}
            className="rounded-md px-2 py-1 text-[11px] text-text-dim hover:bg-panel-3 hover:text-foreground"
          >
            ✎
          </span>
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              run(() => eliminarTarjeta(tarjeta.id));
            }}
            className="rounded-md px-2 py-1 text-[11px] text-text-dim hover:bg-bad-bg hover:text-bad"
          >
            ✕
          </span>
        </div>
      </button>

      {abierta && (
        <div className="border-t border-line-soft bg-panel-3 p-4">
          <div className="mb-2 text-[10.5px] tracking-wide text-text-dim uppercase">Subtareas · definen el estado</div>
          <div className="flex flex-col gap-1.5">
            {tarjeta.subtareas.length === 0 && <p className="text-[12.5px] text-text-dim italic">Sin subtareas. Añade una para desglosar esta tarjeta.</p>}
            {tarjeta.subtareas.map((s) => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-lg border border-line-soft bg-panel-2 px-2.5 py-2">
                <button
                  type="button"
                  onClick={() => run(() => toggleSubtarea(s.id, !s.hecha))}
                  className={`flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border text-[10px] transition ${
                    s.hecha ? "border-ok bg-ok text-[#0e0e0e]" : "border-text-dim text-transparent"
                  }`}
                >
                  ✓
                </button>
                <input
                  defaultValue={s.texto}
                  placeholder="Describe la subtarea…"
                  onBlur={(e) => {
                    if (e.target.value !== s.texto) run(() => editarSubtarea(s.id, e.target.value));
                  }}
                  className={`flex-1 bg-transparent text-[13.5px] outline-none ${s.hecha ? "text-text-dim line-through" : ""}`}
                />
                <button type="button" onClick={() => run(() => eliminarSubtarea(s.id))} className="rounded-md p-1 text-text-dim hover:text-bad">
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => crearSubtarea(tarjeta.id, tarjeta.subtareas.length))}
            className="mt-2.5 w-full rounded-lg border border-dashed border-line-soft py-2 text-[12.5px] text-text-dim hover:border-gold-dim hover:text-gold-bright"
          >
            + Añadir subtarea
          </button>
        </div>
      )}
    </div>
  );
}
