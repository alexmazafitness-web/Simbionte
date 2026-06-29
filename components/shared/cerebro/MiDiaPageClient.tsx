"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import { useCalendarRealtime } from "@/lib/hooks/useCalendarRealtime";
import { crearTarea, marcarTareaHecha } from "@/lib/personal/tasks-actions";
import { taskDoneOn, taskShowToday, type TaskVM } from "@/lib/personal/tasks";
import { addDaysISO, dowOf, minToStr, todayISO } from "@/lib/personal/format";
import { recurOccursOn } from "@/lib/personal/recurrence";
import {
  crearRecordatorio,
  editarRecordatorio,
  eliminarRecordatorio,
  marcarRecordatorioHecho,
} from "@/lib/personal/reminders-actions";
import {
  crearEventoUnico,
  editarEventoUnico,
  eliminarEventoUnico,
} from "@/lib/personal/events-actions";
import { calcularMRR, clientesActivos, hasNotas, type ClienteVM } from "@/lib/coaching/clientes";
import { marcarRevisionHecha, saltarRevision } from "@/lib/coaching/clientes-actions";
import { CATEGORIAS } from "@/lib/coaching/constants";
import { fmtDateCorta } from "@/lib/coaching/format";
import type { OnboardingVM } from "@/lib/coaching/onboarding-queries";
import type { GoalVM } from "@/lib/personal/goal";
import type { EventBlockVM, EventoUnicoVM } from "@/lib/personal/events";
import type { ReminderVM } from "@/lib/personal/reminders";
import { CalEventModal, type CalModalProps } from "./CalEventModal";
import { RevisionNotasDrawer } from "./RevisionNotasDrawer";
import { PlanificadorDrawer } from "./PlanificadorDrawer";
import { usePomodoroCtx } from "@/lib/pomodoro/PomodoroContext";
import type { HorarioConfig } from "@/lib/personal/asistente-types";
import { HORARIO_DEFAULT } from "@/lib/personal/asistente-types";

// ── Calendar constants ────────────────────────────────────────────────────────

const H_START    = 0;
const H_END      = 23;
const HOUR_H     = 52; // px per hour
const GRID_PAD   = 20; // px top & bottom padding inside the grid
const HOURS      = Array.from({ length: H_END - H_START + 1 }, (_, i) => H_START + i); // 00..23
const TOTAL_PX   = HOURS.length * HOUR_H + GRID_PAD * 2;
const DAY_HEADS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Event visual styles
const EVENTO_BG     = "#1e3a5f";
const EVENTO_BORDER = "#C9A96E";
const REMINDER_BG   = "#2a1f0e";
const BLOQUE_BG     = "#1a1a1a";
const BLOQUE_BORDER = "#4b5563";

// ── Types ─────────────────────────────────────────────────────────────────────

type CalModal = CalModalProps | null;

type DragInfo = {
  kind: "evento" | "reminder";
  id: string;
  ev?: EventoUnicoVM;
  r?: ReminderVM;
  startMin: number;
  endMin: number;
  origIso: string;
  grabOffsetMin: number;
};

type DragVisual = {
  id: string;
  kind: "evento" | "reminder";
  iso: string;
  startMin: number;
  endMin: number;
};

// ── helpers (module-level) ────────────────────────────────────────────────────

// Compute days-until/since a target ISO date relative to a given today ISO.
// Negative = overdue.
function daysDiffFromToday(targetISO: string, todayISO: string): number {
  const a = new Date(todayISO  + "T12:00:00").getTime();
  const b = new Date(targetISO + "T12:00:00").getTime();
  return Math.round((b - a) / 86_400_000);
}

function tsToMin(isoTs: string): number {
  const d = new Date(isoTs);
  return d.getHours() * 60 + d.getMinutes();
}

function buildIsoForDB(iso: string, min: number): string {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, Math.floor(min / 60), min % 60, 0).toISOString();
}

function unikoMin(startAt: string): number {
  const d = new Date(startAt);
  return d.getHours() * 60 + d.getMinutes();
}

function eventsOn(iso: string, ev: EventBlockVM[], unicos: EventoUnicoVM[]) {
  const dow = dowOf(iso);
  return {
    blocks: ev.filter((e) => e.recur && recurOccursOn(e.recur, iso, dow)).sort((a, b) => a.startMin - b.startMin),
    unicos: unicos.filter((u) => u.startAt.slice(0, 10) === iso),
  };
}

function remHasTiempo(r: ReminderVM): boolean {
  const d = new Date(r.whenISO);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

// Uses local date arithmetic to avoid UTC offset shifting the day
function localISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDaysLocal(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  return localISO(new Date(y, m - 1, d + n));
}

function weekDays(anchor: string): string[] {
  const [y, m, d] = anchor.split("-").map(Number);
  const dow = new Date(y, m - 1, d).getDay(); // 0=Sun
  const offset = dow === 0 ? -6 : 1 - dow;   // shift to Monday
  return Array.from({ length: 7 }, (_, i) => localISO(new Date(y, m - 1, d + offset + i)));
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <span className="text-sm font-semibold uppercase tracking-widest" style={{ color: "#C9A96E" }}>{children}</span>
      <div className="mt-1.5 h-px" style={{ backgroundColor: "#2a2a2a" }} />
    </div>
  );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border transition ${
      checked ? "border-[#C9A96E] bg-[#C9A96E]" : "hover:border-neutral-500"
    }`} style={{ borderColor: checked ? "#C9A96E" : "#3a3a3a" }}>
      {checked && (
        <svg viewBox="0 0 24 24" fill="none" stroke="#1a1208" strokeWidth={3} className="h-full w-full p-[3px]">
          <path d="M5 13l4 4L19 7" />
        </svg>
      )}
    </span>
  );
}

function BellIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#C9A96E" strokeWidth={1.8}
      className="h-[14px] w-[14px] shrink-0">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function ChevronIcon({ dir = "right" }: { dir?: "left" | "right" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      className={`h-4 w-4 shrink-0 ${dir === "left" ? "rotate-180" : ""}`}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// ── FadeItem wrapper ──────────────────────────────────────────────────────────

function FadeItem({ id, fadingIds, children }: { id: string; fadingIds: Set<string>; children: React.ReactNode }) {
  const fading = fadingIds.has(id);
  return (
    <div
      className="overflow-hidden transition-all duration-700"
      style={{
        opacity: fading ? 0 : 1,
        maxHeight: fading ? 0 : 200,
        marginBottom: fading ? 0 : undefined,
      }}
    >
      {children}
    </div>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-neutral-600">
      {children}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function MiDiaPageClient({
  tasks,
  goal,
  events,
  eventosUnicos,
  reminders,
  clientes,
  onboardings,
  horarioConfig,
}: {
  tasks: TaskVM[];
  goal: GoalVM;
  events: EventBlockVM[];
  eventosUnicos: EventoUnicoVM[];
  reminders: ReminderVM[];
  clientes: ClienteVM[];
  onboardings: OnboardingVM[];
  horarioConfig: HorarioConfig | null;
}) {
  const hoy = todayISO();

  const weekAnchor = hoy;
  const [pending, startTransition]  = useTransition();
  const [isAdding, setIsAdding]     = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [fadingIds, setFadingIds]   = useState<Set<string>>(new Set());
  // Permanent suppression set for revision items — prevents reappearing due to
  // stale-data re-renders that arrive between the fade-out and RSC revalidation.
  const [removingRevIds, setRemovingRevIds] = useState<Set<string>>(new Set());
  const calScrollRef                = useRef<HTMLDivElement>(null);
  const calGridInnerRef             = useRef<HTMLDivElement>(null);

  // Modal
  const [calModal, setCalModal] = useState<CalModal>(null);

  // Drag state — refs to avoid stale closures in event listeners
  const dragRef     = useRef<DragInfo | null>(null);
  const daysRef     = useRef<string[]>([]);
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);

  // Resize state
  const resizeRef      = useRef<{ ev: EventoUnicoVM; iso: string; startMin: number } | null>(null);
  const [resizeEndMin, setResizeEndMin] = useState<number | null>(null);
  const [notasCliente, setNotasCliente] = useState<ClienteVM | null>(null);
  const [planificadorOpen, setPlanificadorOpen] = useState(false);

  const pomodoro = usePomodoroCtx();

  // Pause when any modal/drawer is open OR pomodoro is running on a task
  const refreshPaused =
    calModal !== null ||
    notasCliente !== null ||
    planificadorOpen ||
    (pomodoro.state.running && pomodoro.state.linkedTask !== null);

  // 5-min background refresh; isSafeToRefresh() inside the hook also guards input focus
  useAutoRefresh(300_000, refreshPaused);

  // clientHoy: updates at midnight so day-diff counters stay accurate without router.refresh()
  const [clientHoy, setClientHoy] = useState(hoy);
  useEffect(() => {
    const id = setInterval(() => {
      const newHoy = todayISO();
      setClientHoy((prev) => (prev !== newHoy ? newHoy : prev));
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // Current time in minutes (updates every minute for the now-line)
  const [nowMin, setNowMin] = useState(() => {
    const n = new Date();
    return n.getHours() * 60 + n.getMinutes();
  });
  useEffect(() => {
    const id = setInterval(() => {
      const n = new Date();
      setNowMin(n.getHours() * 60 + n.getMinutes());
    }, 60_000);
    return () => clearInterval(id);
  }, []);

  // MRR
  const mrr    = useMemo(() => Math.round(calcularMRR(clientes)), [clientes]);
  const target = goal.target > 0 ? goal.target : 2000;
  const pct    = Math.min(100, (mrr / target) * 100);

  // Header date text
  const hoyTexto = new Date(hoy + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });

  // Scroll calendar to H_START + 1 on mount
  useEffect(() => {
    if (calScrollRef.current) {
      calScrollRef.current.scrollTop = 6 * HOUR_H; // start at 06:00
    }
  }, []);

  // Realtime sync
  useCalendarRealtime();

  // Week days
  const days = useMemo(() => weekDays(weekAnchor), [weekAnchor]);
  useEffect(() => { daysRef.current = days; }, [days]);

  // Tasks for today
  const todayDow    = dowOf(hoy);
  const tareasHoy   = useMemo(() =>
    [...tasks]
      .filter((t) => taskShowToday(t, hoy, todayDow))
      .sort((a, b) => (a.isPriority === b.isPriority ? 0 : a.isPriority ? -1 : 1)),
  [tasks, hoy, todayDow]);

  // Reminders for today — split by whether they have a specific time
  const recHoySinHora = useMemo(() =>
    reminders
      .filter((r) => !r.done && r.whenISO.slice(0, 10) === hoy && !remHasTiempo(r))
      .sort((a, b) => a.whenISO.localeCompare(b.whenISO)),
  [reminders, hoy]);

  // Coaching data — revPend computed client-side so day counters stay current
  // without requiring a router.refresh() for that purpose alone.
  const activos  = useMemo(() => clientesActivos(clientes), [clientes]);
  const revPend  = useMemo(
    () => activos.filter((c) => c.proximaRevision !== null && daysDiffFromToday(c.proximaRevision, clientHoy) <= 0),
    [activos, clientHoy],
  );
  const conNotas = activos.filter(hasNotas).slice(0, 4);
  const mesoRenovar = useMemo(
    () => activos.filter((c) => c.mesociclo !== null && c.mesociclo.diasRestantes !== null && c.mesociclo.diasRestantes <= 7),
    [activos],
  );

  // revPend filtered through the permanent suppression set:
  //   - show items NOT being removed
  //   - also show items being removed IF they're still mid-fade (to play the animation)
  //   This prevents stale-prop re-renders from resurrecting items the user already dismissed.
  const revPendVisible = useMemo(
    () => revPend.filter((c) => !removingRevIds.has(c.id) || fadingIds.has(`rev-${c.id}`)),
    [revPend, removingRevIds, fadingIds],
  );

  // Fade-out helper
  function fadeAndDo(id: string, action: () => void) {
    setFadingIds((s) => new Set(s).add(id));
    setTimeout(() => {
      action();
      setFadingIds((s) => { const n = new Set(s); n.delete(id); return n; });
    }, 700);
  }

  function handleCheckTask(t: TaskVM) {
    const done = taskDoneOn(t, hoy);
    if (!done) {
      fadeAndDo(`task-${t.id}`, () =>
        startTransition(() => { void marcarTareaHecha(t.id, !!t.recur, hoy, true); })
      );
    } else {
      startTransition(() => { void marcarTareaHecha(t.id, !!t.recur, hoy, false); });
    }
  }

  function handleCheckReminder(r: ReminderVM) {
    fadeAndDo(`rem-${r.id}`, () =>
      startTransition(() => { void marcarRecordatorioHecho(r.id, true); })
    );
  }

  function handleRevisionHecha(clienteId: string) {
    const key = `rev-${clienteId}`;
    // 1. Start fade animation
    setFadingIds((s) => new Set(s).add(key));
    // 2. Permanently suppress from list — stays even if stale props arrive mid-transition
    setRemovingRevIds((s) => new Set(s).add(clienteId));
    // 3. Remove from fadingIds after animation completes (removingRevIds keeps it gone)
    setTimeout(() => setFadingIds((s) => { const n = new Set(s); n.delete(key); return n; }), 700);
    // 4. Fire server action immediately; clean suppression set once RSC data is fresh
    startTransition(async () => {
      await marcarRevisionHecha(clienteId);
      setRemovingRevIds((s) => { const n = new Set(s); n.delete(clienteId); return n; });
    });
  }

  function handleSaltarRevision(clienteId: string) {
    const key = `rev-${clienteId}`;
    setFadingIds((s) => new Set(s).add(key));
    setRemovingRevIds((s) => new Set(s).add(clienteId));
    setTimeout(() => setFadingIds((s) => { const n = new Set(s); n.delete(key); return n; }), 700);
    startTransition(async () => {
      await saltarRevision(clienteId);
      setRemovingRevIds((s) => { const n = new Set(s); n.delete(clienteId); return n; });
    });
  }

  function handleAddTask() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await crearTarea({ title: newTitle.trim(), front: "personal", isPriority: false, date: hoy, recur: null });
      setNewTitle("");
      setIsAdding(false);
    });
  }

  // ── Calendar interaction helpers ─────────────────────────────────────────

  function screenToSlot(clientX: number, clientY: number): { iso: string; min: number } | null {
    const gridEl = calGridInnerRef.current;
    if (!gridEl) return null;
    const rect = gridEl.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top - GRID_PAD;
    if (relX < 40) return null; // time column
    const colAreaW = rect.width - 40;
    const colW     = colAreaW / 7;
    const colIdx   = Math.floor((relX - 40) / colW);
    if (colIdx < 0 || colIdx > 6) return null;
    const iso = daysRef.current[colIdx];
    if (!iso) return null;
    const min = Math.max(0, Math.min(23 * 60 + 59, Math.round((relY / HOUR_H) * 60 / 15) * 15));
    return { iso, min };
  }

  // Click + drag handler for events (< 6px movement = click, else drag)
  function handleEventPointerDown(
    e: React.MouseEvent,
    kind: "evento" | "reminder",
    id: string,
    ev: EventoUnicoVM | undefined,
    r: ReminderVM | undefined,
    startMin: number,
    endMin: number,
    iso: string,
  ) {
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging  = false;

    // Where within the event was the click (for offset-preserving drag)
    const elRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const grabOffsetMin = Math.round(((startY - elRect.top) / HOUR_H) * 60);

    function onMove(ev_: MouseEvent) {
      if (!dragging) {
        if (Math.abs(ev_.clientX - startX) > 5 || Math.abs(ev_.clientY - startY) > 5) {
          dragging = true;
          dragRef.current = { kind, id, ev, r, startMin, endMin, origIso: iso, grabOffsetMin };
          setDragVisual({ id, kind, iso, startMin, endMin });
        }
      }
      if (dragging) {
        const slot = screenToSlot(ev_.clientX, ev_.clientY);
        if (slot) {
          const dur = dragRef.current ? dragRef.current.endMin - dragRef.current.startMin : 0;
          const newStart = slot.min - grabOffsetMin;
          setDragVisual({ id, kind, iso: slot.iso, startMin: newStart, endMin: newStart + dur });
        }
      }
    }

    function onUp(ev_: MouseEvent) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);

      if (dragging && dragRef.current) {
        const slot = screenToSlot(ev_.clientX, ev_.clientY);
        if (slot) {
          const d = dragRef.current;
          const dur = Math.max(15, d.endMin - d.startMin);
          const newStart = Math.max(0, Math.round((slot.min - grabOffsetMin) / 15) * 15);
          const newEnd   = newStart + dur;
          if (kind === "evento" && d.ev) {
            void editarEventoUnico(d.ev.id, {
              title: d.ev.title, type: d.ev.type, notes: d.ev.notes ?? "",
              startAt: buildIsoForDB(slot.iso, newStart),
              endAt:   buildIsoForDB(slot.iso, newEnd),
            });
          } else if (kind === "reminder" && d.r) {
            void editarRecordatorio(d.r.id, d.r.text, buildIsoForDB(slot.iso, newStart), d.r.front);
          }
        }
        dragRef.current = null;
        setDragVisual(null);
      } else if (!dragging) {
        // Simple click → open edit modal
        if (kind === "evento" && ev)  setCalModal({ mode: "evento",   ev,  iso, onClose: () => setCalModal(null) });
        if (kind === "reminder" && r) setCalModal({ mode: "reminder", r,   iso, onClose: () => setCalModal(null) });
      }
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }

  function handleResizePointerDown(
    e: React.MouseEvent,
    ev: EventoUnicoVM,
    iso: string,
    startMin: number,
    currentEndMin: number,
  ) {
    e.stopPropagation();
    e.preventDefault();
    resizeRef.current = { ev, iso, startMin };
    setResizeEndMin(currentEndMin);

    function onMove(ev_: MouseEvent) {
      const gridEl = calGridInnerRef.current;
      if (!gridEl) return;
      const rect = gridEl.getBoundingClientRect();
      const relY  = ev_.clientY - rect.top - GRID_PAD;
      const snapped = Math.max(startMin + 15, Math.min(24 * 60, Math.round((relY / HOUR_H) * 60 / 15) * 15));
      setResizeEndMin(snapped);
    }

    function onUp(ev_: MouseEvent) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",   onUp);
      const resize = resizeRef.current;
      if (resize) {
        const gridEl = calGridInnerRef.current;
        if (gridEl) {
          const rect = gridEl.getBoundingClientRect();
          const relY = ev_.clientY - rect.top - GRID_PAD;
          const newEnd = Math.max(resize.startMin + 15, Math.min(24 * 60, Math.round((relY / HOUR_H) * 60 / 15) * 15));
          void editarEventoUnico(resize.ev.id, {
            title: resize.ev.title, type: resize.ev.type, notes: resize.ev.notes ?? "",
            startAt: buildIsoForDB(resize.iso, resize.startMin),
            endAt:   buildIsoForDB(resize.iso, newEnd),
          });
        }
      }
      resizeRef.current = null;
      setResizeEndMin(null);
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",   onUp);
  }

  function handleSlotClick(e: React.MouseEvent, iso: string) {
    const gridEl = calGridInnerRef.current;
    if (!gridEl) return;
    const rect   = gridEl.getBoundingClientRect();
    const relY   = e.clientY - rect.top - GRID_PAD;
    const startMin = Math.max(0, Math.min(23 * 60, Math.round((relY / HOUR_H) * 60 / 15) * 15));
    setCalModal({ mode: "create", iso, startMin, onClose: () => setCalModal(null) });
  }

  // ── Calendar render ───────────────────────────────────────────────────────

  const calGrid = (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.06]">
      {/* Single scroll container — header is sticky inside so it shares the same width as the grid
          (avoids scrollbar-width misalignment when header is outside the scroll area) */}
      <div ref={calScrollRef} className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 210px)" }}>
        {/* Sticky header */}
        <div className="sticky top-0 z-10 flex border-b border-white/[0.06] bg-[#141414]">
          <div className="w-10 shrink-0" />
          {days.map((iso, i) => {
            const isToday = iso === hoy;
            const d       = new Date(iso + "T12:00:00");
            const num     = d.getDate();
            return (
              <div key={iso} className={`flex flex-1 flex-col items-center py-2 ${
                isToday ? "bg-[#C9A96E]/[0.06]" : ""
              } ${i < 6 ? "border-r border-white/[0.04]" : ""}`}>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? "text-[#C9A96E]" : "text-neutral-600"}`}>
                  {DAY_HEADS[i]}
                </span>
                <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium ${
                  isToday ? "bg-[#C9A96E] font-bold text-[#1a1208]" : "text-neutral-400"
                }`}>
                  {num}
                </span>
              </div>
            );
          })}
        </div>
        <div ref={calGridInnerRef} className="relative flex" style={{ height: TOTAL_PX }}>
          {/* Time column */}
          <div className="pointer-events-none w-10 shrink-0">
            {HOURS.map((h, i) => (
              <div key={h} className="absolute left-0 w-10 pr-2 text-right" style={{ top: GRID_PAD + i * HOUR_H + 3 }}>
                <span className="text-[10px] tabular-nums" style={{ color: "#6b7280" }}>
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((iso, colIdx) => {
            const isToday     = iso === hoy;
            const { blocks, unicos } = eventsOn(iso, events, eventosUnicos);

            return (
              <div
                key={iso}
                className={`relative flex-1 cursor-crosshair ${colIdx < 6 ? "border-r border-white/[0.04]" : ""} ${
                  isToday ? "bg-[#C9A96E]/[0.025]" : ""
                }`}
                onClick={(e) => handleSlotClick(e, iso)}
              >
                {/* Hour lines */}
                {HOURS.map((_, i) => (
                  <div key={i} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.04]" style={{ top: GRID_PAD + i * HOUR_H }} />
                ))}
                {/* Half-hour lines */}
                {HOURS.map((_, i) => (
                  <div key={`h${i}`} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.02]" style={{ top: GRID_PAD + i * HOUR_H + HOUR_H / 2 }} />
                ))}

                {/* Drag target indicator */}
                {dragVisual && dragVisual.iso === iso && (
                  <div
                    className="pointer-events-none absolute inset-x-0.5 z-10 rounded-md border-2 border-dashed"
                    style={{
                      top:    GRID_PAD + (Math.max(0, dragVisual.startMin) / 60) * HOUR_H,
                      height: Math.max(18, ((dragVisual.endMin - Math.max(0, dragVisual.startMin)) / 60) * HOUR_H - 2),
                      borderColor:     dragVisual.kind === "evento" ? EVENTO_BORDER : "#C9A96E",
                      backgroundColor: dragVisual.kind === "evento" ? `${EVENTO_BG}50` : `${REMINDER_BG}50`,
                    }}
                  />
                )}

                {/* Recurring blocks (bloque style — gray, no interaction) */}
                {blocks.map((ev) => {
                  const topMin = Math.max(ev.startMin, 0);
                  const top    = GRID_PAD + (topMin / 60) * HOUR_H + 1;
                  const botMin = Math.min(ev.endMin, HOURS.length * 60);
                  const height = Math.max(((botMin - topMin) / 60) * HOUR_H - 2, 18);
                  return (
                    <div
                      key={ev.id}
                      className="absolute left-0.5 right-0.5 select-none overflow-hidden rounded-md px-1.5 py-0.5"
                      style={{ top, height, backgroundColor: BLOQUE_BG, borderLeft: `3px solid ${BLOQUE_BORDER}` }}
                    >
                      <div className="truncate text-[10px] font-semibold leading-snug text-[#9ca3af]">
                        {ev.title}
                      </div>
                      {height > 30 && (
                        <div className="text-[9px] text-neutral-700">
                          {minToStr(ev.startMin)}–{minToStr(ev.endMin)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* One-time events (draggable + resizable + click-to-edit) */}
                {unicos.map((ev) => {
                  const evStartMin   = tsToMin(ev.startAt);
                  const evEndMin     = ev.endAt ? tsToMin(ev.endAt) : evStartMin + 60;
                  const isResizing   = resizeRef.current?.ev.id === ev.id;
                  const displayEnd   = isResizing && resizeEndMin !== null ? resizeEndMin : evEndMin;
                  const isDragging   = dragVisual?.id === ev.id;
                  const top          = GRID_PAD + (evStartMin / 60) * HOUR_H + 1;
                  const height       = Math.max(18, ((displayEnd - evStartMin) / 60) * HOUR_H - 2);
                  return (
                    <div
                      key={ev.id}
                      className={`absolute left-0.5 right-0.5 select-none overflow-hidden rounded-md transition-opacity ${isDragging ? "opacity-30" : "hover:brightness-110"}`}
                      style={{ top, height, backgroundColor: EVENTO_BG, borderLeft: `3px solid ${EVENTO_BORDER}`, cursor: "grab" }}
                      onMouseDown={(e) => handleEventPointerDown(e, "evento", ev.id, ev, undefined, evStartMin, evEndMin, iso)}
                    >
                      <div className="px-1.5 py-0.5">
                        <div className="truncate text-[10px] font-semibold leading-snug text-white">
                          {ev.title}
                        </div>
                        {height > 30 && (
                          <div className="text-[9px] text-white/50">
                            {minToStr(evStartMin)}–{minToStr(displayEnd)}
                          </div>
                        )}
                      </div>
                      {/* Resize handle */}
                      <div
                        className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize"
                        onMouseDown={(e) => handleResizePointerDown(e, ev, iso, evStartMin, evEndMin)}
                      />
                    </div>
                  );
                })}

                {/* Reminders with time (draggable + click-to-edit) */}
                {reminders
                  .filter((r) => !r.done && r.whenISO.slice(0, 10) === iso && remHasTiempo(r))
                  .map((r) => {
                    const rMin     = tsToMin(r.whenISO);
                    const isDragging = dragVisual?.id === r.id;
                    const top      = GRID_PAD + (rMin / 60) * HOUR_H + 1;
                    return (
                      <div
                        key={r.id}
                        className={`absolute left-0.5 right-0.5 select-none overflow-hidden rounded-md transition-opacity ${isDragging ? "opacity-30" : "hover:brightness-110"}`}
                        style={{ top, height: 26, backgroundColor: REMINDER_BG, borderLeft: `3px solid #C9A96E`, cursor: "grab" }}
                        onMouseDown={(e) => handleEventPointerDown(e, "reminder", r.id, undefined, r, rMin, rMin + 30, iso)}
                      >
                        <div className="truncate px-1.5 py-0.5 text-[9.5px] font-semibold text-[#C9A96E]">
                          {r.text}
                        </div>
                      </div>
                    );
                  })}


                {/* Now line */}
                {isToday && (() => {
                  const nowTop = GRID_PAD + (nowMin / 60) * HOUR_H;
                  const hh = String(Math.floor(nowMin / 60)).padStart(2, "0");
                  const mm = String(nowMin % 60).padStart(2, "0");
                  return (
                    <div className="pointer-events-none absolute inset-x-0 z-20" style={{ top: nowTop }}>
                      <div
                        className="absolute left-0 -translate-y-1/2 rounded px-1.5 py-0.5 text-[10px] font-medium tabular-nums leading-none text-white"
                        style={{ backgroundColor: "#C9A96E" }}
                      >
                        {hh}:{mm}
                      </div>
                      <div className="absolute right-0 h-[1px]" style={{ left: 50, backgroundColor: "#C9A96E", opacity: 0.7 }} />
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Right list ────────────────────────────────────────────────────────────

  const rightList = (
    <div className="flex flex-col gap-8 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>

      {/* ── Tareas del día ─────────────────────────────────────────────── */}
      <div>
        <SectionLabel>Tareas del día</SectionLabel>
        <div className="flex flex-col gap-1">
          {tareasHoy.map((t) => {
            const done = taskDoneOn(t, hoy);
            return (
              <FadeItem key={t.id} id={`task-${t.id}`} fadingIds={fadingIds}>
                <div className="group flex items-center gap-2 rounded-lg px-2 py-2 transition hover:bg-white/[0.03]">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleCheckTask(t)}
                    className="flex flex-1 items-center gap-3 text-left"
                  >
                    <CheckboxIcon checked={done} />
                    <span className={`flex-1 text-[13px] leading-snug ${
                      done ? "text-neutral-600 line-through" : "font-medium text-[#e5e5e5]"
                    }`}>
                      {t.title}
                    </span>
                    {t.isPriority && !done && (
                      <span className="text-[11px] text-[#C9A96E]/50">★</span>
                    )}
                  </button>
                  {!done && (
                    <button
                      type="button"
                      onClick={() => pomodoro.open({ id: t.id, title: t.title })}
                      title="Iniciar pomodoro"
                      className="invisible shrink-0 rounded px-1.5 py-0.5 text-[10px] text-neutral-600 transition group-hover:visible hover:bg-white/[0.05] hover:text-[#C9A96E]"
                    >
                      ▶
                    </button>
                  )}
                </div>
              </FadeItem>
            );
          })}
        </div>
        <div className="mt-2">
          {isAdding ? (
            <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-2 py-2">
              <CheckboxIcon checked={false} />
              <input
                autoFocus
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAddTask();
                  if (e.key === "Escape") { setIsAdding(false); setNewTitle(""); }
                }}
                placeholder="Nombre de la tarea…"
                className="flex-1 bg-transparent text-[13px] text-[#e5e5e5] outline-none placeholder:text-neutral-700"
              />
              <button
                type="button"
                onClick={handleAddTask}
                disabled={!newTitle.trim() || pending}
                className="text-[11px] font-semibold text-[#C9A96E] transition disabled:opacity-30"
              >
                Añadir
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-1.5 px-2 text-[11.5px] font-medium text-[#C9A96E]/60 transition hover:text-[#C9A96E]"
            >
              <span className="text-[14px] leading-none">+</span> Añadir tarea
            </button>
          )}
        </div>
      </div>

      {/* ── Recordatorios (sin hora — los que tienen hora van al calendario) ── */}
      {recHoySinHora.length > 0 && (
        <div>
          <SectionLabel>Recordatorios</SectionLabel>
          <div className="flex flex-col gap-1">
            {recHoySinHora.map((r) => (
              <FadeItem key={r.id} id={`rem-${r.id}`} fadingIds={fadingIds}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleCheckReminder(r)}
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left transition hover:bg-white/[0.03]"
                >
                  <BellIcon />
                  <span className="flex-1 text-[13px] font-medium text-[#e5e5e5]">{r.text}</span>
                </button>
              </FadeItem>
            ))}
          </div>
        </div>
      )}

      {/* ════ BLOQUE: SERVICIO ════════════════════════════════════════════ */}
      {(revPendVisible.length > 0 || mesoRenovar.length > 0 || onboardings.length > 0 || conNotas.length > 0) && (
        <div>
          <SectionLabel>Servicio</SectionLabel>

          <div className="flex flex-col gap-6">

            {/* 1. Revisiones pendientes */}
            {revPendVisible.length > 0 && (
              <div>
                <SubLabel>Revisiones pendientes</SubLabel>
                <div className="flex flex-col gap-2">
                  {revPendVisible.map((c) => (
                    <FadeItem key={c.id} id={`rev-${c.id}`} fadingIds={fadingIds}>
                      <div
                        className="flex items-center gap-3 rounded-lg border p-3"
                        style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-1.5 text-[13px] font-medium text-white">{c.nombre}</div>
                          <div className="flex items-center gap-2">
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                              style={{ backgroundColor: "#3b1f1f", color: "#f87171" }}
                            >
                              Revisión
                            </span>
                            <span className="text-[12px] tabular-nums text-[#f87171]">
                              {Math.abs(daysDiffFromToday(c.proximaRevision!, clientHoy))}d vencida
                            </span>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setNotasCliente(c)}
                            title="Ver / añadir notas"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-500 transition hover:bg-white/[0.08] hover:text-[#C9A96E]"
                            style={{ backgroundColor: "#242424" }}
                          >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                              <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
                              <path d="M17.5 2.5a2.121 2.121 0 0 1 3 3L12 14l-4 1 1-4 7.5-7.5z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleRevisionHecha(c.id)}
                            title="Revisión hecha"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] transition hover:bg-[#2A4A38] hover:text-[#4ade80]"
                            style={{ backgroundColor: "#242424", color: "#4ade80" }}
                          >
                            ✓
                          </button>
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => handleSaltarRevision(c.id)}
                            title="No subida — saltar ciclo"
                            className="flex h-7 w-7 items-center justify-center rounded-md text-[13px] text-neutral-500 transition hover:bg-white/[0.08] hover:text-neutral-300"
                            style={{ backgroundColor: "#242424" }}
                          >
                            ⏭
                          </button>
                        </div>
                      </div>
                    </FadeItem>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Mesociclos a renovar */}
            {mesoRenovar.length > 0 && (
              <div>
                <SubLabel>Mesociclos a renovar</SubLabel>
                <div className="flex flex-col gap-2">
                  {mesoRenovar.map((c) => {
                    const dias = c.mesociclo!.diasRestantes!;
                    const vencido = dias < 0;
                    return (
                      <Link
                        key={c.id}
                        href="/coaching/clientes"
                        className="flex items-center gap-3 rounded-lg border p-3 transition hover:border-white/10 hover:brightness-110"
                        style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="mb-0.5 text-[13px] font-medium text-white">{c.nombre}</div>
                          <div className="text-[11.5px] text-neutral-600">
                            Fin: {fmtDateCorta(c.mesociclo!.fechaFin)}
                          </div>
                        </div>
                        <span
                          className="shrink-0 rounded px-2 py-0.5 text-[11px] font-semibold tabular-nums"
                          style={
                            vencido
                              ? { backgroundColor: "#3b1f1f", color: "#f87171" }
                              : dias === 0
                              ? { backgroundColor: "#2A2210", color: "#C9A96E" }
                              : { backgroundColor: "#2A2210", color: "#C9A96E" }
                          }
                        >
                          {vencido ? "Vencido" : dias === 0 ? "Hoy" : `${dias}d`}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Onboarding activo */}
            {onboardings.length > 0 && (
              <div>
                <SubLabel>Onboarding activo</SubLabel>
                <div className="flex flex-col gap-2">
                  {onboardings.map((ob) => {
                    const pct = ob.totalPasos > 0 ? Math.round((ob.pasosCompletados / ob.totalPasos) * 100) : 0;
                    const planPendiente = ob.pasos.some((p) => p.titulo.includes("plan de entrenamiento") && !p.completado);
                    return (
                      <Link
                        key={ob.id}
                        href="/coaching/onboarding"
                        className="block rounded-lg border p-3 transition hover:border-white/10 hover:brightness-110"
                        style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
                      >
                        <div className="mb-2 flex items-center justify-between">
                          <div className="text-[13px] font-medium text-white">{ob.clienteNombre}</div>
                          <span className="shrink-0 text-[11.5px] tabular-nums" style={{ color: "#C9A96E" }}>
                            D+{ob.diasDesdeInicio}
                          </span>
                        </div>
                        <div className="h-1 overflow-hidden rounded-full" style={{ backgroundColor: "#2a2a2a" }}>
                          <div
                            className="h-full rounded-full transition-[width]"
                            style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#4ade80" : "#C9A96E" }}
                          />
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[11px] text-neutral-600">{ob.pasosCompletados}/{ob.totalPasos} pasos</span>
                          {planPendiente && (
                            <span className="text-[10.5px]" style={{ color: "#f87171" }}>⚠ Plan pendiente</span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Anotaciones de clientes */}
            {conNotas.length > 0 && (
              <div>
                <SubLabel>Anotaciones de clientes</SubLabel>
                <div className="flex flex-col gap-2">
                  {conNotas.map((c) => {
                    const entry = CATEGORIAS
                      .map((cat) => ({ cat, nota: (c.notas[cat] ?? [])[0] }))
                      .find(({ nota }) => nota !== undefined);
                    const cat  = entry?.cat ?? null;
                    const nota = entry?.nota ?? null;

                    const CAT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
                      nutricion:   { bg: "#2A4A38", text: "#4ade80",  label: "Nutrición" },
                      seguimiento: { bg: "#1a1a1a", text: "#C9A96E",  label: "Seguimiento" },
                      meso:        { bg: "#243B55", text: "#93c5fd",  label: "Mesociclo" },
                      otros:       { bg: "#2a2a2a", text: "#9ca3af",  label: "Otros" },
                    };
                    const style = cat ? (CAT_STYLE[cat] ?? CAT_STYLE.otros) : CAT_STYLE.otros;

                    return (
                      <Link
                        key={c.id}
                        href="/coaching/clientes"
                        className="block rounded-lg border p-3 transition hover:border-white/10 hover:brightness-110"
                        style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
                      >
                        <div className="mb-1.5 text-[13px] font-medium text-white">{c.nombre}</div>
                        {nota && (
                          <div className="flex items-start gap-2">
                            <span
                              className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
                              style={{ backgroundColor: style.bg, color: style.text }}
                            >
                              {style.label}
                            </span>
                            <p className="min-w-0 truncate text-[12px] leading-snug text-[#9ca3af]">
                              {nota.texto}
                            </p>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ════ BLOQUE: CONTENIDO (futuro) ══════════════════════════════════ */}
      {/* ════ BLOQUE: ESTUDIO (futuro) ════════════════════════════════════ */}
      {/* ════ BLOQUE: PERSONAL (futuro) ═══════════════════════════════════ */}

    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden px-6 py-6">

      {/* Header */}
      <div className="mb-5 shrink-0">
        <div className="flex items-start justify-between">
          <div>
          <h1 className="font-heading text-[30px] font-semibold capitalize leading-none">
            {hoyTexto}
          </h1>
          <div className="mt-2">
            <span className="text-[11.5px] tabular-nums text-neutral-600">
              {mrr.toLocaleString("es-ES")}€ de {target.toLocaleString("es-ES")}€
            </span>
            <div className="mt-1.5 h-[2px] overflow-hidden rounded-full bg-neutral-800/80">
              <div
                className="h-full rounded-full bg-[#C9A96E] transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
          </div>

          {/* Header actions */}
          <div className="mt-1 flex items-center gap-2">
            {/* Planificar mi día */}
            <button
              type="button"
              onClick={() => setPlanificadorOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition hover:brightness-110"
              style={{ backgroundColor: "rgba(201,169,110,.12)", color: "#C9A96E", border: "1px solid rgba(201,169,110,.2)" }}
            >
              <span className="text-[13px] leading-none">✨</span>
              Planificar
            </button>

            {/* Pomodoro toggle */}
            <button
              type="button"
              onClick={() => pomodoro.open()}
              title="Pomodoro"
              className={`flex h-8 w-8 items-center justify-center rounded-lg border transition hover:brightness-110 ${
                pomodoro.state.open
                  ? "border-[#C9A96E]/40 bg-[#C9A96E]/10 text-[#C9A96E]"
                  : "border-white/[0.06] text-neutral-600 hover:border-white/10 hover:text-neutral-300"
              }`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-4 w-4">
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2 2" />
                <path d="M9 2h6" strokeLinecap="round" />
                <path d="M12 2v3" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

      </div>

      {/* 2-column body */}
      <div className="flex min-h-0 flex-1 gap-5">

        {/* Left: calendar */}
        <div className="flex min-h-0 flex-col" style={{ width: "65%" }}>
          {calGrid}
        </div>

        {/* Separator */}
        <div className="w-px shrink-0 self-stretch bg-white/[0.05]" />

        {/* Right: list */}
        <div className="flex min-h-0 flex-col pt-1" style={{ width: "calc(35% - 22px)" }}>
          {rightList}
        </div>

      </div>

      {/* Calendar event modal (create / edit) */}
      {calModal && <CalEventModal {...calModal} />}

      {/* Revision notes drawer */}
      <RevisionNotasDrawer
        cliente={notasCliente}
        onClose={() => setNotasCliente(null)}
      />

      {/* Daily planner drawer */}
      <PlanificadorDrawer
        open={planificadorOpen}
        onClose={() => setPlanificadorOpen(false)}
        horarioConfig={horarioConfig ?? HORARIO_DEFAULT}
        hoyISO={hoy}
        hoyTexto={hoyTexto}
      />
    </div>
  );
}
