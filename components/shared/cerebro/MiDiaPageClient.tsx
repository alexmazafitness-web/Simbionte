"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import { useCalendarRealtime } from "@/lib/hooks/useCalendarRealtime";
import { crearTarea, marcarTareaHecha } from "@/lib/personal/tasks-actions";
import { taskDoneOn, taskShowToday, type TaskVM } from "@/lib/personal/tasks";
import { addDaysISO, dowOf, minToStr, todayISO, toISO } from "@/lib/personal/format";
import { recurOccursOn } from "@/lib/personal/recurrence";
import { getBloqueStyle } from "@/lib/personal/bloque-colors";
import {
  crearRecordatorio,
  editarRecordatorio,
  eliminarRecordatorio,
} from "@/lib/personal/reminders-actions";
import {
  crearBloque, editarBloque, eliminarBloque,
  crearEventoUnico, editarEventoUnico, eliminarEventoUnico,
  moverBloqueHoy, moverBloqueTodos,
} from "@/lib/personal/events-actions";
import { guardarVistaCalendario } from "@/lib/personal/meta-actions";
import { DAYS, FRONT_COLOR } from "@/lib/personal/constants";
import { calcularMRR, type ClienteVM } from "@/lib/coaching/clientes";
import type { GoalVM } from "@/lib/personal/goal";
import type { EventBlockVM, EventoUnicoVM } from "@/lib/personal/events";
import type { ReminderVM } from "@/lib/personal/reminders";
import { CalEventModal, type CalModalProps } from "./CalEventModal";
import { DiaPopover } from "./DiaPopover";
import { BloqueModal } from "./BloqueModal";
import { CalMovDialog } from "./CalMovDialog";
import { AsistenteChat } from "./AsistenteChat";
import { usePomodoroCtx } from "@/lib/pomodoro/PomodoroContext";
import { getNowMinutes } from "@/lib/time-utils";

// ── Calendar constants ────────────────────────────────────────────────────────

const H_START    = 0;
const H_END      = 23;
const HOUR_H     = 80; // px per hour
const GRID_PAD   = 20; // px top & bottom padding inside the grid
const HOURS      = Array.from({ length: H_END - H_START + 1 }, (_, i) => H_START + i); // 00..23
const TOTAL_PX   = HOURS.length * HOUR_H + GRID_PAD * 2;
const DAY_HEADS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

// Event visual styles
const EVENTO_BG     = "#1e3a5f";
const EVENTO_BORDER = "#C9A96E";
const REMINDER_BG   = "#2a1f0e";

// Desplazamiento mínimo (px) para considerar un mousedown como drag y no click.
// Evita que un click con micro-movimiento (trackpad) dispare el diálogo de mover.
const DRAG_THRESHOLD_PX = 8;

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

// ── Month/Year view constants ─────────────────────────────────────────────────

const MESES_L = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

type Vista = "dia" | "semana" | "mes" | "año";
const VISTA_LABEL: Record<Vista, string> = { dia: "Día", semana: "Semana", mes: "Mes", año: "Año" };

function isoDate(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addMonthsISO(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return isoDate(d.getFullYear(), d.getMonth(), 1);
}

// ── helpers (module-level) ────────────────────────────────────────────────────

// ⚠️ SIEMPRE hora local - nunca UTC
function tsToMin(isoTs: string): number {
  const d = new Date(isoTs);
  return d.getHours() * 60 + d.getMinutes();
}

// Guarda la hora local de pared como timestamp UTC: el Date se construye con
// componentes LOCALES, así que toISOString() es correcto aquí (no tocar).
function buildIsoForDB(iso: string, min: number): string {
  const [y, mo, d] = iso.split("-").map(Number);
  return new Date(y!, mo! - 1, d!, Math.floor(min / 60), min % 60, 0).toISOString();
}

// ⚠️ SIEMPRE hora local - nunca UTC
function unikoMin(startAt: string): number {
  const d = new Date(startAt);
  return d.getHours() * 60 + d.getMinutes();
}

function eventsOn(iso: string, ev: EventBlockVM[], unicos: EventoUnicoVM[]) {
  const dow = dowOf(iso);
  return {
    blocks: ev.filter((e) => e.recur && recurOccursOn(e.recur, iso, dow)).sort((a, b) => a.startMin - b.startMin),
    // ⚠️ SIEMPRE hora local - nunca UTC. Comparamos por fecha
    // LOCAL del startAt (toISO(new Date(...))), no por slice del ISO (que daría
    // la fecha UTC y desfasaría un día en la franja de medianoche).
    unicos: unicos.filter((u) => toISO(new Date(u.startAt)) === iso),
  };
}

// ⚠️ SIEMPRE hora local - nunca UTC
function remHasTiempo(r: ReminderVM): boolean {
  const d = new Date(r.whenISO);
  return d.getHours() !== 0 || d.getMinutes() !== 0;
}

// Eventos y recordatorios "todo el día" de un día concreto — van en la
// franja especial encima del grid de horas, nunca dentro de él.
function allDayItemsOn(iso: string, eventosUnicos: EventoUnicoVM[], reminders: ReminderVM[]) {
  return {
    eventos: eventosUnicos.filter((e) => e.allDay && toISO(new Date(e.startAt)) === iso),
    recordatorios: reminders.filter((r) => r.allDay && !r.done && toISO(new Date(r.whenISO)) === iso),
  };
}

// Traga el "click" fantasma que el navegador dispara justo tras el mouseup
// de un drag real (ver handleBloquePointerDown).
function swallowGhostClick(ev: MouseEvent) {
  ev.stopPropagation();
  ev.preventDefault();
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

// ── Main component ────────────────────────────────────────────────────────────

export function MiDiaPageClient({
  tasks,
  goal,
  events,
  eventosUnicos,
  reminders,
  clientes,
  initialVista = "dia",
}: {
  tasks: TaskVM[];
  goal: GoalVM;
  events: EventBlockVM[];
  eventosUnicos: EventoUnicoVM[];
  reminders: ReminderVM[];
  clientes: ClienteVM[];
  initialVista?: string;
}) {
  // "Hoy" reactivo — se actualiza al cruzar medianoche (efecto más abajo).
  const [hoy, setHoy] = useState(() => todayISO());

  const [pending, startTransition]  = useTransition();
  const [isAdding, setIsAdding]     = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [fadingIds, setFadingIds]   = useState<Set<string>>(new Set());
  const calScrollRef                = useRef<HTMLDivElement>(null);
  const calGridInnerRef             = useRef<HTMLDivElement>(null);

  // Modal
  const [calModal, setCalModal] = useState<CalModal>(null);

  // Popover de día (vistas Mes/Año) — click en un día ya no navega directo a
  // Día, abre este menú con las 3 acciones rápidas.
  const [diaPopover, setDiaPopover] = useState<{ iso: string; rect: DOMRect } | null>(null);

  // Drag state — refs to avoid stale closures in event listeners
  const dragRef     = useRef<DragInfo | null>(null);
  const daysRef     = useRef<string[]>([]);
  const [dragVisual, setDragVisual] = useState<DragVisual | null>(null);

  // Resize state
  const resizeRef      = useRef<{ ev: EventoUnicoVM; iso: string; startMin: number } | null>(null);
  const [resizeEndMin, setResizeEndMin] = useState<number | null>(null);
  const [asistenteChatOpen, setAsistenteChatOpen] = useState(false);

  // Vista del calendario — persisted in personal.meta, locked to "dia" on mobile
  const safeInitial = (["dia","semana","mes","año"].includes(initialVista) ? initialVista : "dia") as Vista;
  const [vista, setVistaState] = useState<Vista>(safeInitial);
  const [isMobile, setIsMobile] = useState(false);
  const [calCursor, setCalCursor] = useState(() => todayISO());

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // On mobile always force "dia" regardless of saved preference
  const vistaEfectiva: Vista = isMobile ? "dia" : vista;

  // navStack: pila de niveles de origen para navegación jerárquica (zoom).
  // Vacía = navegación libre por tabs, sin breadcrumb.
  const [navStack, setNavStack] = useState<Vista[]>([]);

  // Cambio por tabs → navegación libre: se descarta el breadcrumb.
  function setVista(v: Vista) {
    setVistaState(v);
    setNavStack([]);
    guardarVistaCalendario(v).catch(() => {});
  }

  // Drill-down por click (Año→Mes, Mes→Día…): apila el nivel actual como origen.
  function drillTo(target: Vista, cursor: string) {
    setCalCursor(cursor);
    setNavStack((s) => [...s, vista]);
    setVistaState(target);
    guardarVistaCalendario(target).catch(() => {});
  }

  // Click en un día (Mes/Año): abre el popover de acciones rápidas en vez de
  // navegar directo a Día — "Ver día" dentro del popover es lo que ahora
  // llama a drillTo("dia", iso).
  function abrirDiaPopover(e: React.MouseEvent, iso: string) {
    e.stopPropagation();
    setDiaPopover({ iso, rect: e.currentTarget.getBoundingClientRect() });
  }

  // Volver: sube al nivel de origen más reciente y lo desapila.
  function volverNivel() {
    const prev = navStack[navStack.length - 1];
    if (!prev) return;
    setVistaState(prev);
    setNavStack((s) => s.slice(0, -1));
    guardarVistaCalendario(prev).catch(() => {});
  }

  // Navegación temporal según la vista activa. Usada por las flechas que
  // rodean el título, junto al periodo mostrado (Día/Semana/Mes/Año).
  function navPrev() {
    if (vistaEfectiva === "dia") setCalCursor((c) => addDaysLocal(c, -1));
    if (vistaEfectiva === "semana") setCalCursor((c) => addDaysLocal(c, -7));
    if (vistaEfectiva === "mes") setCalCursor((c) => addMonthsISO(c, -1));
    if (vistaEfectiva === "año") setCalCursor((c) => addMonthsISO(c, -12));
  }
  function navNext() {
    if (vistaEfectiva === "dia") setCalCursor((c) => addDaysLocal(c, 1));
    if (vistaEfectiva === "semana") setCalCursor((c) => addDaysLocal(c, 7));
    if (vistaEfectiva === "mes") setCalCursor((c) => addMonthsISO(c, 1));
    if (vistaEfectiva === "año") setCalCursor((c) => addMonthsISO(c, 12));
  }

  // Edición de bloque recurrente
  const [bloqueEditId, setBloqueEditId] = useState<string | null>(null);
  const bloqueEditar = bloqueEditId ? events.find((e) => e.id === bloqueEditId) ?? null : null;

  // Diálogo de mover bloque
  const [movDialog, setMovDialog] = useState<{
    bloqueId: string; dow: number; iso: string; newStartMin: number; newEndMin: number;
  } | null>(null);

  const pomodoro = usePomodoroCtx();

  // Pause when any modal/drawer is open OR pomodoro is running on a task
  const refreshPaused =
    calModal !== null ||
    asistenteChatOpen ||
    bloqueEditId !== null ||
    movDialog !== null ||
    (pomodoro.state.running && pomodoro.state.linkedTask !== null);

  // 5-min background refresh; isSafeToRefresh() inside the hook also guards input focus
  useAutoRefresh(300_000, refreshPaused);

  // Detección de cambio de día. Un timeout calculado al instante exacto de la
  // próxima medianoche (no polling por segundo). Al dispararse: actualiza `hoy`,
  // avanza `calCursor` si el usuario seguía viendo el día de hoy, y se re-arma.
  const hoyRef       = useRef(hoy);
  const calCursorRef = useRef(calCursor);
  useEffect(() => { hoyRef.current = hoy; }, [hoy]);
  useEffect(() => { calCursorRef.current = calCursor; }, [calCursor]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const aplicarCambioDeDia = () => {
      const nuevoHoy = todayISO();
      if (hoyRef.current === nuevoHoy) return;
      const previoHoy = hoyRef.current;
      hoyRef.current = nuevoHoy; // evita doble aplicación (timeout + visibility)
      setHoy(nuevoHoy);
      // Avanzar la vista solo si seguía anclada al día de "hoy"
      if (calCursorRef.current === previoHoy) {
        calCursorRef.current = nuevoHoy;
        setCalCursor(nuevoHoy);
      }
    };

    const armarMedianoche = () => {
      const ahora = new Date();
      // +2s de margen para garantizar que ya cruzó la medianoche local
      const proximaMedianoche = new Date(
        ahora.getFullYear(), ahora.getMonth(), ahora.getDate() + 1, 0, 0, 2, 0,
      ).getTime();
      timer = setTimeout(() => {
        aplicarCambioDeDia();
        armarMedianoche();
      }, proximaMedianoche - ahora.getTime());
    };

    // Corrección inicial: el "hoy" calculado en SSR usa la zona del servidor
    // (UTC en Vercel). Al montar lo realineamos con el día local del cliente.
    aplicarCambioDeDia();
    armarMedianoche();

    // El equipo pudo estar suspendido o la pestaña en background al pasar la
    // medianoche (el timeout no dispara fiable dormido) — revalidar al volver.
    const onVisible = () => {
      if (document.visibilityState === "visible") aplicarCambioDeDia();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  // Current time in minutes (updates every minute for the now-line)
  // ⚠️ SIEMPRE hora local - nunca UTC
  // Arranca en null: el SSR de Vercel corre en UTC y, si el servidor pintase
  // la línea, su posición UTC quedaría clavada en el DOM hasta el siguiente
  // tick (React no parchea mismatches de hidratación). Con null ni el servidor
  // ni el primer render del cliente pintan nada; el efecto la coloca ya
  // montado usando getNowMinutes() — el único punto de verdad de "ahora".
  const [nowMin, setNowMin] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNowMin(getNowMinutes());
    tick();
    const id = setInterval(tick, 60_000);
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

  // Week days — changes based on vistaEfectiva. La semana se ancla a
  // calCursor (navegable con navPrev/navNext), no a "hoy" fijo.
  const days = useMemo(() => {
    if (vistaEfectiva === "dia") return [calCursor];
    if (vistaEfectiva === "semana") return weekDays(calCursor);
    return []; // mes/año don't use the hour grid
  }, [vistaEfectiva, calCursor]);
  useEffect(() => { daysRef.current = days; }, [days]);

  // Título de periodo para Semana, mismo criterio que Mes/Año: se deriva de
  // `days` (la fuente de verdad ya usada para renderizar el grid). Día no
  // tiene título propio aquí — usa el de la cabecera del grid (más abajo).
  const periodoTitulo = useMemo(() => {
    if (vistaEfectiva === "semana" && days.length === 7) {
      const d0 = new Date(days[0]! + "T12:00:00");
      const d6 = new Date(days[6]! + "T12:00:00");
      return `${d0.getDate()} ${MESES_L[d0.getMonth()]} – ${d6.getDate()} ${MESES_L[d6.getMonth()]}`;
    }
    return "";
  }, [vistaEfectiva, days]);

  // Tasks for today
  const todayDow    = dowOf(hoy);
  const tareasHoy   = useMemo(() =>
    [...tasks]
      .filter((t) => taskShowToday(t, hoy, todayDow))
      .sort((a, b) => (a.isPriority === b.isPriority ? 0 : a.isPriority ? -1 : 1)),
  [tasks, hoy, todayDow]);

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
    const nCols    = daysRef.current.length || 1;
    const colW     = colAreaW / nCols;
    const colIdx   = Math.floor((relX - 40) / colW);
    if (colIdx < 0 || colIdx >= nCols) return null;
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
              title: d.ev.title, type: d.ev.type, notes: d.ev.notes ?? "", allDay: d.ev.allDay,
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
            title: resize.ev.title, type: resize.ev.type, notes: resize.ev.notes ?? "", allDay: resize.ev.allDay,
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

  // Drag handler for recurring blocks — click = edit modal, drag = move dialog
  function handleBloquePointerDown(e: React.MouseEvent, bloqueId: string, startMin: number, endMin: number, iso: string) {
    e.stopPropagation();
    e.preventDefault(); // blocks browser-native drag that would interfere with custom drag
    const startX = e.clientX;
    const startY = e.clientY;
    let isDragging = false;
    const dur = endMin - startMin;

    // Destino = start original + desplazamiento del cursor. Con desplazamiento
    // pequeño devuelve EXACTAMENTE la posición original (mismo start_min y
    // mismo día): el mouseup decide click vs drag comparando el dato que
    // importa — ¿cambió la hora del bloque? — no píxeles.
    function destAt(clientX: number, clientY: number): { iso: string; newStart: number } | null {
      const slot = screenToSlot(clientX, clientY);
      if (!slot) return null;
      // Vertical: trunc, no round — mover un slot exige desplazar los 15 min
      // COMPLETOS (13px). Un temblor de pocos px se queda en delta 0.
      const deltaMin = Math.trunc(((clientY - startY) / HOUR_H) * 60 / 15) * 15;
      const newStart = Math.max(0, Math.min(23 * 60, startMin + deltaMin));
      // Horizontal: zona muerta de 24px — un temblor sobre el borde de la
      // columna no cambia de día; más allá, manda la columna bajo el cursor.
      const destIso = Math.abs(clientX - startX) < 24 ? iso : slot.iso;
      return { iso: destIso, newStart };
    }

    function onMove(mv: MouseEvent) {
      // Sigue siendo click mientras el cursor no se aleje DRAG_THRESHOLD_PX
      // del punto inicial; solo al superar el umbral se activa el drag visual.
      if (!isDragging) {
        if (Math.abs(mv.clientX - startX) < DRAG_THRESHOLD_PX && Math.abs(mv.clientY - startY) < DRAG_THRESHOLD_PX) return;
        isDragging = true;
        document.body.style.cursor = "grabbing";
      }
      const dest = destAt(mv.clientX, mv.clientY);
      if (dest) {
        setDragVisual({ id: bloqueId, kind: "evento", iso: dest.iso, startMin: dest.newStart, endMin: dest.newStart + dur });
      } else {
        setDragVisual(null);
      }
    }

    function onUp(up: MouseEvent) {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
      setDragVisual(null); // always restore block opacity first
      if (!isDragging) {
        // Nunca se superó el umbral → click puro → modal de edición
        setBloqueEditId(bloqueId);
        return;
      }
      // Hubo drag real: mousedown y mouseup casi siempre ocurren sobre
      // elementos DOM distintos (el bloque vs. la columna del día bajo el
      // cursor tras moverse). El navegador dispara igualmente un "click"
      // nativo justo después de este mouseup, sobre el ancestro común más
      // cercano — la columna del día — que abriría el modal de "crear
      // evento" (handleSlotClick) a la vez que el diálogo de mover. Se traga
      // ese único click fantasma antes de que llegue a ningún handler.
      document.addEventListener("click", swallowGhostClick, { capture: true, once: true });
      const dest = destAt(up.clientX, up.clientY);
      if (!dest) return; // soltado fuera del grid → drag cancelado, no hacer nada
      if (dest.iso === iso && dest.newStart === startMin) {
        // Hubo drag (superó el umbral) pero acabó en la misma posición →
        // no es click ni drag real → no hacer nada (ni modal ni diálogo).
        return;
      }
      setMovDialog({ bloqueId, dow: dowOf(iso), iso, newStartMin: dest.newStart, newEndMin: dest.newStart + dur });
    }

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  // ── Month/Year sub-renders ────────────────────────────────────────────────

  function renderMes() {
    const d0      = new Date(calCursor + "T00:00:00");
    const y       = d0.getFullYear();
    const m       = d0.getMonth();
    const numDays = new Date(y, m + 1, 0).getDate();
    let   fdow    = new Date(y, m, 1).getDay();
    fdow = fdow === 0 ? 6 : fdow - 1;
    const cells   = Math.ceil((fdow + numDays) / 7) * 7;

    return (
      <>
        {/* Título con flechas a los lados, centrado sobre el grid */}
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={navPrev} className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">‹</button>
          <h2 className="min-w-[150px] text-center text-sm uppercase tracking-widest text-[#f5f5f5]">
            {MESES_L[m]} {y}
          </h2>
          <button type="button" onClick={navNext} className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">›</button>
        </div>
        <div className="overflow-hidden rounded-xl border border-white/[0.06]" style={{ background: "#141414" }}>
        <div className="grid grid-cols-7 border-b border-white/[0.06]">
          {[...DAYS.slice(1), DAYS[0]].map((dh) => (
            <div key={dh} className="border-r border-white/[0.04] py-2.5 text-center text-[10px] font-semibold tracking-wider text-neutral-600 uppercase last:border-r-0">
              {dh}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: cells }, (_, i) => {
            const day     = i - fdow + 1;
            const inMonth = day >= 1 && day <= numDays;
            const isLastRow = Math.floor(i / 7) === Math.floor((cells - 1) / 7);
            const isLastCol = (i + 1) % 7 === 0;
            const borders   = `${!isLastRow ? "border-b border-white/[0.04]" : ""} ${!isLastCol ? "border-r border-white/[0.04]" : ""}`;
            if (!inMonth) return <div key={i} className={`min-h-[80px] ${borders}`} style={{ background: "rgba(0,0,0,.12)" }} />;

            const iso        = isoDate(y, m, day);
            // Solo eventos únicos (start_at). Los bloques recurrentes de la
            // plantilla semanal se omiten en Mes/Año: se repiten a diario y
            // saturan la vista sin aportar info útil.
            const { unicos: uDay } = eventsOn(iso, events, eventosUnicos);
            const isToday    = iso === hoy;
            const frontTypes = [...new Set(uDay.map((u) => u.type))];
            const totalEv    = uDay.length;
            const allDayEv   = uDay.filter((u) => u.allDay);

            return (
              <div
                key={i}
                onClick={(e) => abrirDiaPopover(e, iso)}
                className={`min-h-[80px] cursor-pointer p-2.5 transition hover:bg-white/[0.03] ${borders}`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                  isToday ? "font-bold text-[#1a1208]" : "text-neutral-400"
                }`} style={isToday ? { backgroundColor: "#C9A96E" } : {}}>
                  {day}
                </span>
                {allDayEv.length > 0 && (
                  <div className="mt-1 flex flex-col gap-0.5">
                    {allDayEv.slice(0, 2).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        title={ev.title}
                        onClick={(e) => { e.stopPropagation(); setCalModal({ mode: "evento", ev, iso, onClose: () => setCalModal(null) }); }}
                        className="truncate rounded px-1 py-0.5 text-left text-[8.5px] font-semibold text-white transition hover:brightness-110"
                        style={{ backgroundColor: FRONT_COLOR[ev.type] }}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {allDayEv.length > 2 && <span className="text-[8px] leading-none text-neutral-600">+{allDayEv.length - 2} más</span>}
                  </div>
                )}
                {frontTypes.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-[3px]">
                    {frontTypes.slice(0, 3).map((ft) => (
                      <span key={ft} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: FRONT_COLOR[ft] }} />
                    ))}
                    {totalEv > 3 && <span className="text-[9px] leading-none text-neutral-600">+{totalEv - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      </>
    );
  }

  function renderAño() {
    const y    = new Date(calCursor + "T00:00:00").getFullYear();
    const curM = new Date(calCursor + "T00:00:00").getMonth();

    return (
      <>
        {/* Título con flechas a los lados, centrado sobre el grid */}
        <div className="flex items-center justify-center gap-4">
          <button type="button" onClick={navPrev} className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">‹</button>
          <h2 className="min-w-[80px] text-center text-sm uppercase tracking-widest text-[#f5f5f5]">
            {y}
          </h2>
          <button type="button" onClick={navNext} className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">›</button>
        </div>
        <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, mIdx) => {
          const numDays = new Date(y, mIdx + 1, 0).getDate();
          let   fdow    = new Date(y, mIdx, 1).getDay();
          fdow = fdow === 0 ? 6 : fdow - 1;
          const cells   = Math.ceil((fdow + numDays) / 7) * 7;

          return (
            <div
              key={mIdx}
              className="overflow-hidden rounded-xl border"
              style={{ background: "#141414", borderColor: curM === mIdx ? "rgba(201,169,110,.4)" : "rgba(255,255,255,.06)" }}
            >
              <button
                type="button"
                onClick={() => drillTo("mes", isoDate(y, mIdx, 1))}
                className="w-full border-b border-white/[0.06] px-3 py-2 text-left hover:bg-white/[0.03]"
              >
                <span className="text-[12px] font-semibold" style={{ color: curM === mIdx ? "#C9A96E" : "#a3a3a3" }}>
                  {MESES_L[mIdx]}
                </span>
              </button>
              <div className="p-2">
                <div className="mb-1 grid grid-cols-7 text-center">
                  {["L","M","X","J","V","S","D"].map((dh) => (
                    <div key={dh} className="text-[7.5px] text-neutral-600">{dh}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: cells }, (_, i) => {
                    const day = i - fdow + 1;
                    const inM = day >= 1 && day <= numDays;
                    if (!inM) return <div key={i} className="h-5" />;
                    const iso      = isoDate(y, mIdx, day);
                    const isToday  = iso === hoy;
                    // Solo eventos únicos (start_at) — sin bloques recurrentes.
                    const { unicos: uDay } = eventsOn(iso, events, eventosUnicos);
                    const fTypes   = [...new Set(uDay.map((u) => u.type))];
                    return (
                      <div
                        key={i}
                        onClick={(e) => abrirDiaPopover(e, iso)}
                        className="flex h-5 cursor-pointer flex-col items-center justify-center rounded hover:bg-white/[0.04]"
                      >
                        <span className="text-[9px] leading-none" style={{ color: isToday ? "#C9A96E" : "#6b7280", fontWeight: isToday ? 700 : 400 }}>
                          {day}
                        </span>
                        {fTypes.length > 0 && (
                          <div className="flex gap-px">
                            {fTypes.slice(0, 2).map((ft) => (
                              <span key={ft} className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: FRONT_COLOR[ft] }} />
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      </>
    );
  }

  // ── Calendar render ───────────────────────────────────────────────────────

  // ¿Hay algún "todo el día" en los días visibles? Solo entonces se renderiza
  // la franja especial (evita una fila vacía la mayoría de las veces).
  const hayAllDay = days.some((iso) => {
    const { eventos, recordatorios } = allDayItemsOn(iso, eventosUnicos, reminders);
    return eventos.length > 0 || recordatorios.length > 0;
  });

  const calGrid = (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.06]">
      {/* Single scroll container — header is sticky inside so it shares the same width as the grid
          (avoids scrollbar-width misalignment when header is outside the scroll area) */}
      <div ref={calScrollRef} className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 210px)" }}>
        {/* Sticky header + franja "todo el día" en un único contenedor sticky
            (así ambas filas quedan fijas al hacer scroll, sin necesitar
            calcular el offset "top" de la segunda fila). En Día, flechas ‹ ›
            agrupadas y centradas junto al título (el contenedor centra el
            grupo; el bloque del día NO lleva flex-1 para que las flechas
            queden pegadas a él, no en los bordes). */}
        <div className="sticky top-0 z-10 bg-[#141414]">
          <div className={`flex items-center ${hayAllDay ? "" : "border-b border-white/[0.06]"}`}>
            <div className="w-10 shrink-0" />
            <div className={vistaEfectiva === "dia" ? "flex flex-1 items-center justify-center gap-4" : "flex flex-1"}>
              {vistaEfectiva === "dia" && (
                <button type="button" onClick={navPrev} className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">‹</button>
              )}
              {days.map((iso, i) => {
                const isToday = iso === hoy;
                const d       = new Date(iso + "T12:00:00");
                const num     = d.getDate();
                const dayName = DAYS[dowOf(iso)] ?? DAY_HEADS[i] ?? "";
                return (
                  <div key={iso} className={`flex ${vistaEfectiva === "dia" ? "" : "flex-1"} flex-col items-center py-2 ${
                    isToday ? "bg-[#C9A96E]/[0.06]" : ""
                  } ${i < days.length - 1 ? "border-r border-white/[0.04]" : ""}`}>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? "text-[#C9A96E]" : "text-neutral-600"}`}>
                      {dayName}
                    </span>
                    <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-[13px] font-medium ${
                      isToday ? "bg-[#C9A96E] font-bold text-[#1a1208]" : "text-neutral-400"
                    }`}>
                      {num}
                    </span>
                  </div>
                );
              })}
              {vistaEfectiva === "dia" && (
                <button type="button" onClick={navNext} className="flex h-6 w-6 shrink-0 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">›</button>
              )}
            </div>
          </div>

          {/* Franja "todo el día" — como en Google Calendar, fuera del grid de horas */}
          {hayAllDay && (
            <div className="flex items-stretch border-b border-white/[0.06]">
              <div className="w-10 shrink-0" />
              {days.map((iso, i) => {
                const { eventos, recordatorios } = allDayItemsOn(iso, eventosUnicos, reminders);
                return (
                  <div key={iso} className={`flex flex-1 flex-col gap-1 p-1 ${i < days.length - 1 ? "border-r border-white/[0.04]" : ""}`}>
                    {eventos.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        title={ev.title}
                        onClick={() => setCalModal({ mode: "evento", ev, iso, onClose: () => setCalModal(null) })}
                        className="truncate rounded px-1.5 py-0.5 text-left text-[9.5px] font-semibold text-white transition hover:brightness-110"
                        style={{ backgroundColor: EVENTO_BG, borderLeft: `2px solid ${EVENTO_BORDER}` }}
                      >
                        {ev.title}
                      </button>
                    ))}
                    {recordatorios.map((r) => (
                      <button
                        key={r.id}
                        type="button"
                        title={r.text}
                        onClick={() => setCalModal({ mode: "reminder", r, iso, onClose: () => setCalModal(null) })}
                        className="truncate rounded px-1.5 py-0.5 text-left text-[9.5px] font-semibold transition hover:brightness-110"
                        style={{ backgroundColor: REMINDER_BG, color: "#C9A96E", borderLeft: "2px solid #C9A96E" }}
                      >
                        {r.text}
                      </button>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div ref={calGridInnerRef} className="relative flex" style={{ height: TOTAL_PX }}>
          {/* Time column — 25 etiquetas (00..24, la última vuelve a "00:00"),
              -translate-y-1/2 centra cada etiqueta EXACTAMENTE sobre su línea
              (mismo patrón que la línea de "ahora" más abajo), en vez de
              desplazarla hacia el centro de la franja. */}
          <div className="pointer-events-none w-10 shrink-0">
            {Array.from({ length: HOURS.length + 1 }, (_, i) => (
              <div key={i} className="absolute left-0 w-10 -translate-y-1/2 pr-2 text-right" style={{ top: GRID_PAD + i * HOUR_H }}>
                <span className="text-[10px] tabular-nums" style={{ color: "#6b7280" }}>
                  {String(i % 24).padStart(2, "0")}:00
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
                {/* Hour lines — 25 líneas (00..24) para cerrar el rango con el
                    00:00 del día siguiente; con GRID_PAD igual arriba y abajo
                    queda simétrico respecto al borde del contenedor. */}
                {Array.from({ length: HOURS.length + 1 }, (_, i) => (
                  <div key={i} className="pointer-events-none absolute inset-x-0 border-t border-white/[0.04]" style={{ top: GRID_PAD + i * HOUR_H }} />
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

                {/* Recurring blocks — colored, click to edit, drag to move */}
                {blocks.map((ev) => {
                  const topMin  = Math.max(ev.startMin, 0);
                  const top     = GRID_PAD + (topMin / 60) * HOUR_H + 1;
                  const botMin  = Math.min(ev.endMin, HOURS.length * 60);
                  const height  = Math.max(((botMin - topMin) / 60) * HOUR_H - 2, 18);
                  const style   = getBloqueStyle(ev.title);
                  const isDraggingThis = dragVisual?.id === ev.id;
                  return (
                    <div
                      key={ev.id}
                      className={`absolute left-0.5 right-0.5 select-none overflow-hidden rounded-md px-1.5 py-0.5 transition-opacity ${isDraggingThis ? "opacity-30" : "cursor-grab hover:brightness-110"}`}
                      style={{ top, height, backgroundColor: style.bg, borderLeft: `3px solid ${style.border}` }}
                      onMouseDown={(e) => handleBloquePointerDown(e, ev.id, ev.startMin, ev.endMin, iso)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="truncate text-[10px] font-semibold leading-snug" style={{ color: style.text }}>
                        {ev.title}
                      </div>
                      {height > 30 && (
                        <div className="text-[9px]" style={{ color: style.text, opacity: 0.6 }}>
                          {minToStr(ev.startMin)}–{minToStr(ev.endMin)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* One-time events (draggable + resizable + click-to-edit) — los
                    "todo el día" se muestran en la franja especial de arriba, no aquí */}
                {unicos.filter((ev) => !ev.allDay).map((ev) => {
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

                {/* Reminders with time (draggable + click-to-edit) — los "todo
                    el día" se muestran en la franja especial de arriba, no aquí */}
                {reminders
                  .filter((r) => !r.done && !r.allDay && toISO(new Date(r.whenISO)) === iso && remHasTiempo(r))
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


                {/* Now line — ⚠️ SIEMPRE hora local - nunca UTC: la posición
                    sale de nowMin (getNowMinutes), que solo se fija en cliente */}
                {isToday && nowMin !== null && (() => {
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
            {/* Asistente conversacional */}
            <button
              type="button"
              onClick={() => setAsistenteChatOpen(true)}
              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-semibold transition hover:brightness-110"
              style={{ backgroundColor: "rgba(201,169,110,.15)", color: "#C9A96E", border: "1px solid rgba(201,169,110,.25)" }}
            >
              <span className="text-[13px] leading-none">✨</span>
              Asistente
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
        <div className="flex min-h-0 flex-col gap-3" style={{ width: "65%" }}>
          {/* Vista selector + navigation — hidden on mobile (always "día") */}
          {!isMobile && (
            <div className="flex items-center gap-2">
              {/* Vista tabs */}
              <div className="flex overflow-hidden rounded-lg border border-white/[0.08] text-[11.5px]">
                {(["dia","semana","mes","año"] as Vista[]).map((v, i) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setVista(v)}
                    className={`px-3 py-1.5 transition capitalize ${
                      vista === v ? "text-[#C9A96E]" : "text-neutral-500 hover:text-neutral-300"
                    } ${i > 0 ? "border-l border-white/[0.08]" : ""}`}
                    style={vista === v ? { background: "rgba(201,169,110,.08)" } : {}}
                  >
                    {v === "dia" ? "Día" : v === "semana" ? "Semana" : v === "mes" ? "Mes" : "Año"}
                  </button>
                ))}
              </div>

              {/* Breadcrumb "Volver" — solo tras drill-down por click (no por tabs) */}
              {navStack.length > 0 && (
                <button
                  type="button"
                  onClick={volverNivel}
                  className="flex items-center gap-1 rounded-lg border border-white/[0.08] px-2.5 py-1.5 text-[11.5px] text-neutral-400 transition hover:bg-white/[0.04] hover:text-neutral-200"
                >
                  ← Volver a {VISTA_LABEL[navStack[navStack.length - 1]!]}
                </button>
              )}

              {/* "Hoy" — las flechas de navegación van junto al título, debajo */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCalCursor(hoy)}
                  className="rounded px-2 py-0.5 text-[10px] text-neutral-600 hover:text-neutral-300 hover:bg-white/[0.06]"
                >
                  Hoy
                </button>
              </div>
            </div>
          )}

          {/* Título de periodo con flechas a los lados, centrado — mismo
              patrón visual que Mes/Año (ver renderMes/renderAño). Solo
              Semana: Día ya muestra su título con flechas en la cabecera
              del grid (dentro de calGrid, más abajo). */}
          {vistaEfectiva === "semana" && (
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={navPrev} className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">‹</button>
              <h2 className="min-w-[150px] text-center text-sm uppercase tracking-widest text-[#f5f5f5]">
                {periodoTitulo}
              </h2>
              <button type="button" onClick={navNext} className="flex h-6 w-6 items-center justify-center rounded text-neutral-500 hover:bg-white/[0.06] hover:text-neutral-200">›</button>
            </div>
          )}

          {/* Grid for dia/semana, or month/year views */}
          {(vistaEfectiva === "dia" || vistaEfectiva === "semana") && calGrid}
          {vistaEfectiva === "mes" && renderMes()}
          {vistaEfectiva === "año" && renderAño()}
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

      {/* Popover de acciones rápidas al hacer click en un día (Mes/Año) */}
      {diaPopover && (
        <DiaPopover
          anchorRect={diaPopover.rect}
          onNuevoEvento={() => {
            const iso = diaPopover.iso;
            setDiaPopover(null);
            setCalModal({ mode: "create", iso, startMin: 9 * 60, tipoInicial: "evento", onClose: () => setCalModal(null) });
          }}
          onNuevoRecordatorio={() => {
            const iso = diaPopover.iso;
            setDiaPopover(null);
            setCalModal({ mode: "create", iso, startMin: 9 * 60, tipoInicial: "recordatorio", onClose: () => setCalModal(null) });
          }}
          onVerDia={() => {
            const iso = diaPopover.iso;
            setDiaPopover(null);
            drillTo("dia", iso);
          }}
          onClose={() => setDiaPopover(null)}
        />
      )}

      {/* Recurring block edit modal */}
      <BloqueModal
        key={bloqueEditId ?? "none"}
        open={bloqueEditId !== null}
        onClose={() => setBloqueEditId(null)}
        bloque={bloqueEditar ?? null}
        pending={pending}
        onSubmit={(input) => {
          if (!bloqueEditId) return;
          startTransition(async () => {
            await editarBloque(bloqueEditId, input);
            setBloqueEditId(null);
          });
        }}
        onDelete={bloqueEditId ? () => {
          startTransition(async () => {
            await eliminarBloque(bloqueEditId!);
            setBloqueEditId(null);
          });
        } : undefined}
      />

      {/* Move dialog for recurring blocks */}
      <CalMovDialog
        open={movDialog !== null}
        dow={movDialog?.dow ?? 0}
        onCancel={() => setMovDialog(null)}
        onHoy={() => {
          if (!movDialog) return;
          const { bloqueId, iso, newStartMin, newEndMin } = movDialog;
          setMovDialog(null);
          startTransition(async () => { await moverBloqueHoy(bloqueId, iso, newStartMin, newEndMin); });
        }}
        onTodos={() => {
          if (!movDialog) return;
          const { bloqueId, newStartMin, newEndMin } = movDialog;
          setMovDialog(null);
          startTransition(async () => { await moverBloqueTodos(bloqueId, newStartMin, newEndMin); });
        }}
      />

      {/* Conversational AI assistant */}
      <AsistenteChat
        open={asistenteChatOpen}
        onClose={() => setAsistenteChatOpen(false)}
      />
    </div>
  );
}
