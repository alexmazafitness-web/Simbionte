"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  crearEventoUnico,
  editarEventoUnico,
  eliminarEventoUnico,
  type EventoUnicoInput,
} from "@/lib/personal/events-actions";
import {
  crearRecordatorio,
  editarRecordatorio,
  eliminarRecordatorio,
} from "@/lib/personal/reminders-actions";
import type { EventoUnicoVM } from "@/lib/personal/events";
import type { ReminderVM } from "@/lib/personal/reminders";
import type { Front } from "@/lib/personal/constants";
import { FRONT_LABEL } from "@/lib/personal/constants";

// ── helpers ─────────────────────────────────────────────────────────────────

function minToHHMM(min: number): string {
  return `${String(Math.floor(Math.max(0, min) / 60)).padStart(2, "0")}:${String(Math.max(0, min) % 60).padStart(2, "0")}`;
}

function buildIsoForDB(iso: string, hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, h ?? 0, m ?? 0, 0).toISOString();
}

function tsToHHMM(isoTs: string): string {
  const d = new Date(isoTs);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── types ────────────────────────────────────────────────────────────────────

export type CalModalProps =
  | { mode: "create"; iso: string; startMin: number; onClose: () => void }
  | { mode: "evento";   ev: EventoUnicoVM; iso: string; onClose: () => void }
  | { mode: "reminder"; r: ReminderVM;     iso: string; onClose: () => void };

// ── component ────────────────────────────────────────────────────────────────

export function CalEventModal(props: CalModalProps) {
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const isCreate = props.mode === "create";

  const [tipo, setTipo] = useState<"evento" | "recordatorio">(() =>
    props.mode === "reminder" ? "recordatorio" : "evento"
  );

  const [titulo, setTitulo] = useState(() => {
    if (props.mode === "evento")   return props.ev.title;
    if (props.mode === "reminder") return props.r.text;
    return "";
  });

  const [startHHMM, setStartHHMM] = useState(() => {
    if (props.mode === "create")   return minToHHMM(props.startMin);
    if (props.mode === "evento")   return tsToHHMM(props.ev.startAt);
    if (props.mode === "reminder") return tsToHHMM(props.r.whenISO);
    return "09:00";
  });

  const [endHHMM, setEndHHMM] = useState(() => {
    if (props.mode === "create") return minToHHMM(props.startMin + 60);
    if (props.mode === "evento") {
      if (props.ev.endAt) return tsToHHMM(props.ev.endAt);
      const d = new Date(props.ev.startAt);
      return minToHHMM(d.getHours() * 60 + d.getMinutes() + 60);
    }
    return "";
  });

  const [front, setFront] = useState<Front>(() =>
    props.mode === "evento" ? props.ev.type : "personal"
  );

  const [notas, setNotas] = useState(() =>
    props.mode === "evento" ? (props.ev.notes ?? "") : ""
  );

  useEffect(() => { titleRef.current?.focus(); }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") props.onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [props]);

  const iso = props.mode === "create" ? props.iso : props.iso;

  function handleSave() {
    if (!titulo.trim()) return;
    startTransition(async () => {
      if (props.mode === "reminder") {
        await editarRecordatorio(props.r.id, titulo.trim(), buildIsoForDB(iso, startHHMM), props.r.front);
      } else if (props.mode === "evento") {
        const input: EventoUnicoInput = {
          title: titulo.trim(),
          startAt: buildIsoForDB(iso, startHHMM),
          endAt: endHHMM ? buildIsoForDB(iso, endHHMM) : null,
          type: front,
          notes: notas,
        };
        await editarEventoUnico(props.ev.id, input);
      } else {
        // create mode
        if (tipo === "recordatorio") {
          await crearRecordatorio(titulo.trim(), buildIsoForDB(iso, startHHMM), "personal");
        } else {
          const input: EventoUnicoInput = {
            title: titulo.trim(),
            startAt: buildIsoForDB(iso, startHHMM),
            endAt: endHHMM ? buildIsoForDB(iso, endHHMM) : null,
            type: front,
            notes: notas,
          };
          await crearEventoUnico(input);
        }
      }
      props.onClose();
    });
  }

  function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return; }
    startTransition(async () => {
      if (props.mode === "evento")   await eliminarEventoUnico(props.ev.id);
      if (props.mode === "reminder") await eliminarRecordatorio(props.r.id);
      props.onClose();
    });
  }

  const dateLabel = new Date(iso + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  const showFrontSelector = (isCreate && tipo === "evento") || props.mode === "evento";
  const showEndTime       = (isCreate && tipo === "evento") || props.mode === "evento";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={props.onClose} />

      {/* Panel */}
      <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/[0.08] bg-[#1a1a1a] p-6 shadow-2xl shadow-black/70">

        {/* Header */}
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600 capitalize">{dateLabel}</p>
            <h2 className="mt-0.5 font-heading text-[18px] font-semibold text-[#e5e5e5]">
              {isCreate ? "Nuevo" : "Editar"}
            </h2>
          </div>
          <button type="button" onClick={props.onClose}
            className="rounded-md p-1 text-neutral-600 transition hover:text-neutral-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tipo pills (create only) */}
        {isCreate && (
          <div className="mb-4 flex gap-2">
            {(["evento", "recordatorio"] as const).map((t) => (
              <button key={t} type="button" onClick={() => setTipo(t)}
                className={`rounded-lg px-3 py-1.5 text-[11.5px] font-medium capitalize transition ${
                  tipo === t
                    ? "bg-[#C9A96E]/15 text-[#C9A96E]"
                    : "bg-white/[0.04] text-neutral-500 hover:text-neutral-300"
                }`}>
                {t === "evento" ? "Evento" : "Recordatorio"}
              </button>
            ))}
          </div>
        )}

        {/* Tipo badge (edit) */}
        {!isCreate && (
          <div className="mb-4">
            <span className="rounded-lg bg-[#C9A96E]/10 px-2.5 py-1 text-[10.5px] font-medium text-[#C9A96E]">
              {props.mode === "evento" ? "Evento" : "Recordatorio"}
            </span>
          </div>
        )}

        {/* Título */}
        <div className="mb-4">
          <input ref={titleRef} type="text" value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            placeholder="Título"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[14px] text-[#e5e5e5] outline-none placeholder:text-neutral-600 focus:border-[#C9A96E]/40 transition" />
        </div>

        {/* Horas */}
        <div className="mb-4 flex gap-3">
          <div className="flex-1">
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-neutral-600">
              {tipo === "recordatorio" && isCreate ? "Hora" : "Inicio"}
            </label>
            <input type="time" value={startHHMM} onChange={(e) => setStartHHMM(e.target.value)}
              className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] tabular-nums text-[#e5e5e5] outline-none focus:border-[#C9A96E]/40 transition" />
          </div>
          {showEndTime && (
            <div className="flex-1">
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-neutral-600">Fin</label>
              <input type="time" value={endHHMM} onChange={(e) => setEndHHMM(e.target.value)}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] tabular-nums text-[#e5e5e5] outline-none focus:border-[#C9A96E]/40 transition" />
            </div>
          )}
        </div>

        {/* Área (solo eventos) */}
        {showFrontSelector && (
          <div className="mb-4">
            <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-neutral-600">Área</label>
            <div className="flex gap-1.5">
              {(["personal", "coaching", "formacion", "contenido"] as Front[]).map((f) => (
                <button key={f} type="button" onClick={() => setFront(f)}
                  className={`flex-1 rounded-lg py-1.5 text-[10px] font-medium transition ${
                    front === f
                      ? "border border-[#C9A96E]/30 bg-[#C9A96E]/10 text-[#C9A96E]"
                      : "border border-white/[0.05] bg-white/[0.02] text-neutral-600 hover:text-neutral-400"
                  }`}>
                  {FRONT_LABEL[f].slice(0, 5)}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Notas */}
        <div className="mb-5">
          <input type="text" value={notas} onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas opcionales"
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[13px] text-neutral-400 outline-none placeholder:text-neutral-700 focus:border-[#C9A96E]/40 transition" />
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {!isCreate && (
            <button type="button" disabled={pending} onClick={handleDelete}
              className={`rounded-lg px-3 py-2 text-[12px] font-medium transition ${
                confirmDelete
                  ? "bg-red-600/20 text-red-400 hover:bg-red-600/30"
                  : "text-neutral-600 hover:text-red-400"
              }`}>
              {confirmDelete ? "¿Seguro?" : "Eliminar"}
            </button>
          )}
          <div className="flex-1" />
          <button type="button" onClick={props.onClose}
            className="rounded-lg px-4 py-2 text-[12px] text-neutral-600 transition hover:text-neutral-300">
            Cancelar
          </button>
          <button type="button" disabled={!titulo.trim() || pending} onClick={handleSave}
            className="rounded-lg bg-[#C9A96E]/20 px-4 py-2 text-[12px] font-semibold text-[#C9A96E] transition hover:bg-[#C9A96E]/30 disabled:opacity-40">
            {pending ? "…" : "Guardar"}
          </button>
        </div>
      </div>
    </>
  );
}
