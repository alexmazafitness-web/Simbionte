"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  usePomodoroCtx,
  MODE_PRESETS,
  MODE_LABEL,
  CYCLE_OPTIONS,
} from "@/lib/pomodoro/PomodoroContext";
import type { Phase, PomodoroConfig, PomodoroMode } from "@/lib/pomodoro/PomodoroContext";

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const PHASE_LABEL: Record<Phase, string> = {
  focus: "Enfoque",
  short: "Descanso corto",
  long:  "Descanso largo",
};

const PHASE_ACCENT: Record<Phase, string> = {
  focus: "#C9A96E",
  short: "#4ade80",
  long:  "#4ade80",
};

const PHASE_BG: Record<Phase, string> = {
  focus: "#1a1a1a",
  short: "#0e1f16",
  long:  "#0e1f16",
};

// ── Config form ───────────────────────────────────────────────────────────────

const MODES: PomodoroMode[] = ["clasico", "sprint", "deep", "micro", "personalizado"];

type CustomKey = "focusMins" | "shortMins" | "longMins";
const CUSTOM_FIELDS: Array<{ label: string; key: CustomKey; max: number }> = [
  { label: "Enfoque",     key: "focusMins", max: 180 },
  { label: "Descanso",    key: "shortMins", max: 60  },
  { label: "Desc. largo", key: "longMins",  max: 90  },
];

// ── Icons ─────────────────────────────────────────────────────────────────────

function IconX() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function IconPlay() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function IconPause() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </svg>
  );
}

function IconReset() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 .49-3" />
    </svg>
  );
}

function IconSkip() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
      <polygon points="5,4 15,12 5,20" />
      <rect x="17" y="4" width="2" height="16" />
    </svg>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function PomodoroWidget() {
  const [mounted, setMounted] = useState(false);
  const { state, play, pause, reset, skip, close, minimize, expand, updateConfig } = usePomodoroCtx();

  useEffect(() => setMounted(true), []);

  if (!mounted || !state.open) return null;

  const accent = PHASE_ACCENT[state.phase];
  const bg     = PHASE_BG[state.phase];

  function selectMode(mode: PomodoroMode) {
    if (mode === "personalizado") {
      updateConfig({ mode });
    } else {
      updateConfig({ mode, ...MODE_PRESETS[mode] });
    }
  }

  // ── Minimized pill ────────────────────────────────────────────────────────
  if (state.minimized) {
    return createPortal(
      <div
        className="fixed bottom-6 right-6 z-50 flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 shadow-xl shadow-black/50 transition hover:brightness-110"
        style={{ backgroundColor: bg, borderColor: "#2a2a2a" }}
        onClick={() => expand()}
      >
        <span className="font-heading text-[18px] tabular-nums leading-none" style={{ color: accent }}>
          {fmt(state.secondsLeft)}
        </span>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); state.running ? pause() : play(); }}
          className="text-xs transition hover:scale-110"
          style={{ color: accent }}
        >
          {state.running ? "⏸" : "▶"}
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); expand(); }}
          className="text-neutral-600 text-xs transition hover:text-neutral-300"
          title="Expandir"
        >
          ↑
        </button>
      </div>,
      document.body,
    );
  }

  // ── Full widget ───────────────────────────────────────────────────────────
  return createPortal(
    <div
      className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border shadow-2xl shadow-black/60 transition-colors duration-500"
      style={{ backgroundColor: bg, borderColor: "#2a2a2a" }}
    >
      {/* Header row */}
      <div className="flex items-center justify-between px-4 pt-4 pb-1">
        <span
          className="text-[10px] font-semibold uppercase tracking-[0.18em]"
          style={{ color: accent }}
        >
          {PHASE_LABEL[state.phase]}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => minimize()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] text-neutral-600 transition hover:text-neutral-300"
            title="Minimizar"
          >
            –
          </button>
          <button
            type="button"
            onClick={() => close()}
            className="flex h-6 w-6 items-center justify-center rounded-md text-neutral-600 transition hover:text-red-400"
            title="Cerrar"
          >
            <IconX />
          </button>
        </div>
      </div>

      {/* Linked task */}
      {state.linkedTask && (
        <p className="truncate px-4 pb-1 text-[11px] text-neutral-500">
          Enfocando en: <span className="text-neutral-300">{state.linkedTask.title}</span>
        </p>
      )}

      {/* Timer display */}
      <div className="px-4 py-4 text-center">
        <span
          className="font-display tabular-nums leading-none"
          style={{ fontSize: "72px", color: accent, lineHeight: 1 }}
        >
          {fmt(state.secondsLeft)}
        </span>
      </div>

      {/* Pomodoros completed */}
      <div className="px-4 pb-3 text-center">
        {state.pomodorosCompleted > 0 ? (
          <span className="text-[11px] text-neutral-600">
            {"🍅".repeat(Math.min(state.pomodorosCompleted, 8))}{" "}
            <span className="ml-1">
              {state.pomodorosCompleted} completado{state.pomodorosCompleted !== 1 ? "s" : ""}
            </span>
          </span>
        ) : (
          <span className="text-[11px] text-neutral-700">
            Ciclo {state.pomodorosThisCycle + 1} / {state.config.cycleCount}
          </span>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-5 px-4 pb-5">
        <button
          type="button"
          onClick={() => reset()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] text-neutral-500 transition hover:border-white/15 hover:text-neutral-200"
          title="Reiniciar"
        >
          <IconReset />
        </button>
        <button
          type="button"
          onClick={() => state.running ? pause() : play()}
          className="flex h-14 w-14 items-center justify-center rounded-full border transition hover:brightness-110"
          style={{ backgroundColor: accent + "22", borderColor: accent + "55", color: accent }}
          title={state.running ? "Pausar" : "Iniciar"}
        >
          {state.running ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          onClick={() => skip()}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] text-neutral-500 transition hover:border-white/15 hover:text-neutral-200"
          title="Saltar fase"
        >
          <IconSkip />
        </button>
      </div>

      {/* Modos predefinidos */}
      <div className="border-t px-4 py-3" style={{ borderColor: "#242424" }}>
        <div className="mb-2 text-[9.5px] uppercase tracking-wide text-neutral-600">Modo</div>
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => {
            const active = state.config.mode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => selectMode(m)}
                className={`rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition ${
                  active
                    ? "border-transparent bg-[#C9A96E] text-[#1a1208]"
                    : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                }`}
              >
                {MODE_LABEL[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Valores personalizados — solo en modo "Personalizado" */}
      {state.config.mode === "personalizado" && (
        <div className="px-4 pb-3">
          <div className="grid grid-cols-3 gap-2">
            {CUSTOM_FIELDS.map(({ label, key, max }) => (
              <div key={key}>
                <label className="mb-1 block text-[9px] uppercase tracking-wide text-neutral-600">
                  {label}
                </label>
                <input
                  type="number"
                  min={1}
                  max={max}
                  value={state.config[key]}
                  onChange={(e) =>
                    updateConfig({ [key]: Math.max(1, Math.min(max, Number(e.target.value))) } as Partial<PomodoroConfig>)
                  }
                  className="w-full rounded-lg border bg-black/30 px-2 py-1.5 text-[12px] text-neutral-300 outline-none transition focus:border-white/20 [color-scheme:dark]"
                  style={{ borderColor: "#2a2a2a" }}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ciclos + descanso largo */}
      <div className="flex items-center justify-between gap-3 border-t px-4 py-3" style={{ borderColor: "#242424" }}>
        <div className={state.config.longBreakEnabled ? "" : "pointer-events-none opacity-40"}>
          <div className="mb-1.5 text-[9.5px] uppercase tracking-wide text-neutral-600">
            Ciclos antes del descanso largo
          </div>
          <div className="flex gap-1.5">
            {CYCLE_OPTIONS.map((n) => {
              const active = state.config.cycleCount === n;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => updateConfig({ cycleCount: n })}
                  className={`flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold transition ${
                    active
                      ? "border-transparent bg-[#C9A96E] text-[#1a1208]"
                      : "border-white/10 text-neutral-400 hover:border-white/20 hover:text-neutral-200"
                  }`}
                >
                  {n}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex shrink-0 flex-col items-end gap-1.5">
          <span className="text-[9.5px] uppercase tracking-wide text-neutral-600">Descanso largo activo</span>
          <button
            type="button"
            role="switch"
            aria-checked={state.config.longBreakEnabled}
            onClick={() => updateConfig({ longBreakEnabled: !state.config.longBreakEnabled })}
            className="relative h-5 w-9 shrink-0 rounded-full transition"
            style={{ backgroundColor: state.config.longBreakEnabled ? "#C9A96E" : "rgba(255,255,255,0.1)" }}
          >
            <span
              className="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: state.config.longBreakEnabled ? "translateX(18px)" : "translateX(2px)" }}
            />
          </button>
        </label>
      </div>
    </div>,
    document.body,
  );
}
