"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { guardarHorarioConfig, aceptarPlan } from "@/lib/personal/asistente-actions";
import type {
  BloquePlan,
  BloquePlanActivo,
  FrentePlan,
  HorarioConfig,
  PlanIA,
} from "@/lib/personal/asistente-types";

// ── Colors by frente ─────────────────────────────────────────────────────────

const FRENTE_COLOR: Record<FrentePlan, string> = {
  Servicio:  "#C9A96E",
  Contenido: "#A78BDB",
  Estudio:   "#5DCAA5",
  Personal:  "#6BA3E0",
};

const FRENTE_BG: Record<FrentePlan, string> = {
  Servicio:  "rgba(201,169,110,.15)",
  Contenido: "rgba(167,139,219,.15)",
  Estudio:   "rgba(93,202,165,.15)",
  Personal:  "rgba(107,163,224,.15)",
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function minToDiff(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  return toMin(end) - toMin(start);
}

function isActivo(b: BloquePlan): b is BloquePlanActivo {
  return !b.tipo;
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SpinnerIcon() {
  return (
    <svg
      className="h-10 w-10 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <circle cx="12" cy="12" r="10" className="opacity-20" />
      <path d="M12 2a10 10 0 0 1 10 10" style={{ color: "#C9A96E" }} />
    </svg>
  );
}

function TimeInput({
  value,
  onChange,
  onDone,
}: {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); ref.current?.select(); }, []);
  return (
    <input
      ref={ref}
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onDone}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === "Escape") onDone(); }}
      className="w-[72px] rounded border bg-transparent px-1.5 py-0.5 text-[13px] font-bold tabular-nums outline-none"
      style={{ borderColor: "#3a3a3a", color: "#C9A96E" }}
    />
  );
}

// ── BloqueCard ────────────────────────────────────────────────────────────────

type EditTimeState = { idx: number; field: "inicio" | "fin" } | null;

function BloqueCard({
  bloque,
  idx,
  total,
  dragIdx,
  dropIdx,
  editTime,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onEditTimeStart,
  onEditTimeChange,
  onEditTimeDone,
}: {
  bloque: BloquePlan;
  idx: number;
  total: number;
  dragIdx: number | null;
  dropIdx: number | null;
  editTime: EditTimeState;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  onEditTimeStart: (field: "inicio" | "fin") => void;
  onEditTimeChange: (field: "inicio" | "fin", val: string) => void;
  onEditTimeDone: () => void;
}) {
  if (bloque.tipo === "descanso") {
    const dur = minToDiff(bloque.hora_inicio, bloque.hora_fin);
    return (
      <div className="flex items-center gap-3 py-1">
        <span className="w-[72px] shrink-0 text-right text-[11px] tabular-nums text-neutral-700">
          {bloque.hora_inicio}
        </span>
        <div className="flex flex-1 items-center gap-2">
          <div className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
          <span className="text-[10.5px] text-neutral-700">Descanso · {dur} min</span>
          <div className="h-px flex-1" style={{ backgroundColor: "#2a2a2a" }} />
        </div>
      </div>
    );
  }

  const activo = bloque as BloquePlanActivo;
  const dur = minToDiff(activo.hora_inicio, activo.hora_fin);
  const isDragging = dragIdx === idx;
  const isDropTarget = dropIdx === idx && dragIdx !== null && dragIdx !== idx;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className="group rounded-lg border transition-all"
      style={{
        backgroundColor:  "#1a1a1a",
        borderColor:      isDropTarget ? FRENTE_COLOR[activo.frente] : "#2a2a2a",
        opacity:          isDragging ? 0.4 : 1,
        cursor:           "grab",
        boxShadow:        isDropTarget ? `0 0 0 1px ${FRENTE_COLOR[activo.frente]}40` : undefined,
      }}
    >
      {/* Card header */}
      <div className="flex items-start gap-3 p-3 pb-2">

        {/* Time column */}
        <div className="flex w-[72px] shrink-0 flex-col items-end gap-0.5 pt-0.5">
          {editTime?.idx === idx && editTime.field === "inicio" ? (
            <TimeInput
              value={activo.hora_inicio}
              onChange={(v) => onEditTimeChange("inicio", v)}
              onDone={onEditTimeDone}
            />
          ) : (
            <button
              type="button"
              onClick={() => onEditTimeStart("inicio")}
              className="font-heading text-[15px] font-bold tabular-nums leading-none transition hover:opacity-70"
              style={{ color: "#C9A96E" }}
            >
              {activo.hora_inicio}
            </button>
          )}
          <div className="h-[1px] w-4 self-center" style={{ backgroundColor: "#3a3a3a" }} />
          {editTime?.idx === idx && editTime.field === "fin" ? (
            <TimeInput
              value={activo.hora_fin}
              onChange={(v) => onEditTimeChange("fin", v)}
              onDone={onEditTimeDone}
            />
          ) : (
            <button
              type="button"
              onClick={() => onEditTimeStart("fin")}
              className="font-heading text-[12px] tabular-nums leading-none text-neutral-600 transition hover:opacity-70"
            >
              {activo.hora_fin}
            </button>
          )}
          <span className="mt-1 text-[10px] text-neutral-800">{dur} min</span>
        </div>

        {/* Main content */}
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex items-center gap-2">
            <span
              className="rounded px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-widest"
              style={{ backgroundColor: FRENTE_BG[activo.frente], color: FRENTE_COLOR[activo.frente] }}
            >
              {activo.frente}
            </span>
          </div>
          <p className="text-[13px] font-semibold leading-snug text-white">{activo.titulo}</p>
        </div>

        {/* Actions */}
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            onClick={onDelete}
            title="Eliminar bloque"
            className="flex h-6 w-6 items-center justify-center rounded text-neutral-700 transition hover:bg-white/[0.06] hover:text-[#f87171]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
          <div
            className="flex h-6 w-6 cursor-grab items-center justify-center rounded text-neutral-700 hover:text-neutral-400"
            title="Arrastrar para reordenar"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
              <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
              <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
              <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
            </svg>
          </div>
        </div>
      </div>

      {/* Steps */}
      {activo.pasos.length > 0 && (
        <div className="px-3 pb-3 pl-[88px]">
          <ul className="flex flex-col gap-1">
            {activo.pasos.map((paso, pi) => (
              <li key={pi} className="flex items-start gap-2 text-[12px] leading-snug text-neutral-500">
                <span className="mt-[3px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: FRENTE_COLOR[activo.frente], opacity: 0.6 }} />
                {paso}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Left accent line */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
        style={{ backgroundColor: FRENTE_COLOR[activo.frente], opacity: 0.5 }}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

type Fase = "input" | "generando" | "plan" | "aceptando" | "exito";

export function PlanificadorDrawer({
  open,
  onClose,
  horarioConfig,
  hoyISO,
  hoyTexto,
}: {
  open: boolean;
  onClose: () => void;
  horarioConfig: HorarioConfig;
  hoyISO: string;
  hoyTexto: string;
}) {
  const router = useRouter();

  const isWeekend = [0, 6].includes(new Date().getDay());
  const defaultSlot = isWeekend ? horarioConfig.finde : horarioConfig.entre_semana;

  const [fase, setFase]                   = useState<Fase>("input");
  const [horaInicio, setHoraInicio]       = useState(defaultSlot.inicio);
  const [horas, setHoras]                 = useState(defaultSlot.horas);
  const [bloques, setBloques]             = useState<BloquePlan[]>([]);
  const [pospuesto, setPospuesto]         = useState<string[]>([]);
  const [error, setError]                 = useState<string | null>(null);
  const [dragIdx, setDragIdx]             = useState<number | null>(null);
  const [dropIdx, setDropIdx]             = useState<number | null>(null);
  const [editTime, setEditTime]           = useState<EditTimeState>(null);

  // Reset state each time drawer opens
  useEffect(() => {
    if (open) {
      const slot = isWeekend ? horarioConfig.finde : horarioConfig.entre_semana;
      setHoraInicio(slot.inicio);
      setHoras(slot.horas);
      setFase("input");
      setBloques([]);
      setPospuesto([]);
      setError(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape" && open && fase !== "aceptando") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, fase, onClose]);

  async function handleGenerar() {
    setFase("generando");
    setError(null);

    // Save new defaults silently
    const newConfig: HorarioConfig = {
      ...horarioConfig,
      [isWeekend ? "finde" : "entre_semana"]: { inicio: horaInicio, horas },
    };
    guardarHorarioConfig(newConfig).catch(console.error);

    try {
      const res = await fetch("/api/asistente/planificar", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ hora_inicio: horaInicio, horas_disponibles: horas }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: PlanIA = await res.json();
      if ("error" in data) throw new Error((data as { error: string }).error);
      setBloques(data.bloques ?? []);
      setPospuesto(data.pospuesto ?? []);
      setFase("plan");
    } catch (e) {
      console.error("[PlanificadorDrawer]", e);
      setError("No se pudo generar el plan. Comprueba la conexión e inténtalo de nuevo.");
      setFase("input");
    }
  }

  async function handleAceptar() {
    const bloquesActivos = bloques.filter(isActivo);
    setFase("aceptando");
    try {
      await aceptarPlan(bloquesActivos, hoyISO);
      setFase("exito");
      setTimeout(() => {
        onClose();
        router.refresh();
      }, 1800);
    } catch (e) {
      console.error("[PlanificadorDrawer] aceptar:", e);
      setFase("plan");
      setError("Error al guardar los eventos. Inténtalo de nuevo.");
    }
  }

  function handleDeleteBloque(idx: number) {
    setBloques((prev) => prev.filter((_, i) => i !== idx));
  }

  function handleDropBloque(fromIdx: number, toIdx: number) {
    if (fromIdx === toIdx) return;
    setBloques((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  }

  function handleEditTimeChange(idx: number, field: "inicio" | "fin", val: string) {
    setBloques((prev) =>
      prev.map((b, i) => {
        if (i !== idx || !isActivo(b)) return b;
        return field === "inicio"
          ? { ...b, hora_inicio: val }
          : { ...b, hora_fin: val };
      }),
    );
  }

  const bloquesActivos = bloques.filter(isActivo).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{ backgroundColor: "rgba(0,0,0,0.6)", opacity: open ? 1 : 0 }}
        onClick={() => fase !== "aceptando" && onClose()}
      />

      {/* Panel */}
      <div
        className="relative z-10 flex h-full w-full max-w-[520px] flex-col overflow-hidden"
        style={{
          backgroundColor: "#141414",
          borderLeft:      "2px solid #2a2a2a",
          transform:       open ? "translateX(0)" : "translateX(100%)",
          transition:      "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >

        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ borderBottom: "2px solid #1e1e1e" }}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px]">✨</span>
              <h2 className="text-[15px] font-semibold text-white">Plan del día</h2>
            </div>
            <p className="mt-0.5 text-[11.5px] capitalize text-neutral-600">{hoyTexto}</p>
          </div>
          {fase !== "aceptando" && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 transition hover:bg-white/[0.06] hover:text-neutral-300"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto">

          {/* ── INPUT ─────────────────────────────────────────────────── */}
          {fase === "input" && (
            <div className="flex flex-col gap-6 px-5 py-6">
              <div>
                <p className="mb-4 text-[13px] leading-relaxed text-neutral-500">
                  Configura tu sesión de trabajo. El asistente revisará todo lo que tienes
                  pendiente y te propondrá un plan realista.
                </p>

                {/* Hora inicio */}
                <div className="mb-4">
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-600">
                    ¿A qué hora empiezas?
                  </label>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="w-full rounded-lg border bg-transparent px-3 py-2.5 text-[15px] font-bold tabular-nums text-white outline-none transition focus:border-[#C9A96E]/50"
                    style={{ borderColor: "#2a2a2a" }}
                  />
                </div>

                {/* Horas disponibles */}
                <div>
                  <label className="mb-1.5 block text-[11px] font-semibold uppercase tracking-widest text-neutral-600">
                    ¿Cuánto tiempo tienes?
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHoras(h)}
                        className="rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition"
                        style={{
                          backgroundColor: horas === h ? "rgba(201,169,110,.15)" : "#1e1e1e",
                          color:           horas === h ? "#C9A96E" : "#6b7280",
                          border:          `2px solid ${horas === h ? "rgba(201,169,110,.3)" : "#2a2a2a"}`,
                        }}
                      >
                        {h < 1 ? "30 min" : `${h}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {error && (
                <div
                  className="rounded-lg px-3 py-2.5 text-[12.5px] leading-snug"
                  style={{ backgroundColor: "#2d1515", color: "#f87171" }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── GENERANDO ─────────────────────────────────────────────── */}
          {fase === "generando" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-5 px-5 py-20">
              <div style={{ color: "#C9A96E" }}>
                <SpinnerIcon />
              </div>
              <div className="text-center">
                <p className="text-[14px] font-medium text-[#e5e5e5]">Analizando tu día...</p>
                <p className="mt-1 text-[12px] text-neutral-600">Esto puede tardar unos segundos</p>
              </div>
              {/* Animated dots */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: "#C9A96E",
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      opacity: 0.4,
                    }}
                  />
                ))}
              </div>
              <style>{`@keyframes pulse { 0%,100%{opacity:.2;transform:scale(.9)} 50%{opacity:1;transform:scale(1.1)} }`}</style>
            </div>
          )}

          {/* ── PLAN ──────────────────────────────────────────────────── */}
          {(fase === "plan" || fase === "aceptando") && (
            <div className="flex flex-col gap-1 px-5 py-5">
              {/* Summary line */}
              <div className="mb-3 flex items-center justify-between">
                <span className="text-[11.5px] text-neutral-600">
                  {bloquesActivos} bloque{bloquesActivos !== 1 ? "s" : ""} de trabajo
                </span>
                <span className="text-[11px] text-neutral-700">
                  Arrastra para reordenar · Hover para editar
                </span>
              </div>

              {bloques.length === 0 && (
                <p className="py-8 text-center text-[13px] text-neutral-600">
                  No hay bloques. Vuelve a generar el plan.
                </p>
              )}

              <div className="relative flex flex-col gap-2">
                {bloques.map((bloque, idx) => (
                  <div key={idx} className="relative">
                    <BloqueCard
                      bloque={bloque}
                      idx={idx}
                      total={bloques.length}
                      dragIdx={dragIdx}
                      dropIdx={dropIdx}
                      editTime={editTime}
                      onDelete={() => handleDeleteBloque(idx)}
                      onDragStart={() => setDragIdx(idx)}
                      onDragOver={(e) => { e.preventDefault(); setDropIdx(idx); }}
                      onDrop={() => {
                        if (dragIdx !== null) handleDropBloque(dragIdx, idx);
                        setDragIdx(null);
                        setDropIdx(null);
                      }}
                      onDragEnd={() => { setDragIdx(null); setDropIdx(null); }}
                      onEditTimeStart={(field) => setEditTime({ idx, field })}
                      onEditTimeChange={(field, val) => handleEditTimeChange(idx, field, val)}
                      onEditTimeDone={() => setEditTime(null)}
                    />
                  </div>
                ))}
              </div>

              {/* Pospuesto */}
              {pospuesto.length > 0 && (
                <div className="mt-4 rounded-lg border px-4 py-3" style={{ borderColor: "#2a2a2a", backgroundColor: "#161616" }}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
                    No entra hoy
                  </p>
                  {pospuesto.map((item, i) => (
                    <p key={i} className="flex items-start gap-2 text-[12px] leading-snug text-neutral-600">
                      <span className="mt-[5px] h-1 w-1 shrink-0 rounded-full bg-neutral-700" />
                      {item}
                    </p>
                  ))}
                </div>
              )}

              {error && (
                <div
                  className="mt-2 rounded-lg px-3 py-2.5 text-[12.5px]"
                  style={{ backgroundColor: "#2d1515", color: "#f87171" }}
                >
                  {error}
                </div>
              )}
            </div>
          )}

          {/* ── ÉXITO ─────────────────────────────────────────────────── */}
          {fase === "exito" && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 px-5 py-20">
              <div
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ backgroundColor: "#1a3320" }}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth={2.5} className="h-7 w-7">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold text-white">Plan añadido al calendario</p>
                <p className="mt-1 text-[12.5px] text-neutral-600">
                  {bloquesActivos} bloque{bloquesActivos !== 1 ? "s" : ""} · ya aparecen en tu día
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-5 py-4"
          style={{ borderTop: "2px solid #1e1e1e" }}
        >
          {fase === "input" && (
            <button
              type="button"
              onClick={handleGenerar}
              className="flex w-full items-center justify-center gap-2 rounded-lg py-3 text-[13.5px] font-semibold transition hover:brightness-110"
              style={{ backgroundColor: "#C9A96E", color: "#1a1208" }}
            >
              <span>✨</span>
              Generar plan
            </button>
          )}

          {(fase === "plan") && (
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => { setFase("input"); setError(null); }}
                className="flex-1 rounded-lg border py-2.5 text-[12.5px] font-semibold text-neutral-500 transition hover:border-white/10 hover:text-neutral-300"
                style={{ borderColor: "#2a2a2a" }}
              >
                ← Regenerar
              </button>
              <button
                type="button"
                onClick={handleAceptar}
                disabled={bloquesActivos === 0}
                className="flex-2 rounded-lg px-5 py-2.5 text-[12.5px] font-semibold transition disabled:opacity-40 hover:brightness-110"
                style={{ backgroundColor: "#C9A96E", color: "#1a1208", flex: 2 }}
              >
                Aceptar plan →
              </button>
            </div>
          )}

          {fase === "aceptando" && (
            <div className="flex items-center justify-center gap-2 py-2.5 text-[13px] text-neutral-500">
              <div
                className="h-4 w-4 animate-spin rounded-full border-[3px]"
                style={{ borderColor: "#3a3a3a", borderTopColor: "#C9A96E" }}
              />
              Guardando en el calendario...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
