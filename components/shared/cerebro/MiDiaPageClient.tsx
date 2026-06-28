"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useAutoRefresh } from "@/lib/hooks/useAutoRefresh";
import { crearTarea, marcarTareaHecha } from "@/lib/personal/tasks-actions";
import { taskDoneOn, taskShowToday, type TaskVM } from "@/lib/personal/tasks";
import { addDaysISO, dowOf, minToStr, todayISO } from "@/lib/personal/format";
import { recurOccursOn } from "@/lib/personal/recurrence";
import { marcarRecordatorioHecho } from "@/lib/personal/reminders-actions";
import { calcularMRR, clientesActivos, hasNotas, type ClienteVM } from "@/lib/coaching/clientes";
import { marcarRevisionHecha } from "@/lib/coaching/clientes-actions";
import { CATEGORIAS } from "@/lib/coaching/constants";
import { FRONT_COLOR } from "@/lib/personal/constants";
import type { GoalVM } from "@/lib/personal/goal";
import type { EventBlockVM, EventoUnicoVM } from "@/lib/personal/events";
import type { ReminderVM } from "@/lib/personal/reminders";

// ── Calendar constants ────────────────────────────────────────────────────────

const H_START  = 6;
const H_END    = 23;
const HOUR_H   = 52; // px per hour
const HOURS    = Array.from({ length: H_END - H_START + 1 }, (_, i) => H_START + i);
const TOTAL_PX = HOURS.length * HOUR_H;
const DAY_HEADS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

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
    <div className="mb-2 flex items-center gap-2">
      <span className="text-[9.5px] font-bold uppercase tracking-widest text-neutral-500">{children}</span>
      <span className="h-px flex-1 bg-white/[0.06]" />
    </div>
  );
}

function CheckboxIcon({ checked }: { checked: boolean }) {
  return (
    <span className={`flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-[4px] border transition ${
      checked ? "border-[#C9A96E] bg-[#C9A96E]" : "border-neutral-700 hover:border-neutral-500"
    }`}>
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
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}
      className="h-[14px] w-[14px] shrink-0 text-neutral-600">
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

// ── Main component ────────────────────────────────────────────────────────────

export function MiDiaPageClient({
  tasks,
  goal,
  events,
  eventosUnicos,
  reminders,
  clientes,
}: {
  tasks: TaskVM[];
  goal: GoalVM;
  events: EventBlockVM[];
  eventosUnicos: EventoUnicoVM[];
  reminders: ReminderVM[];
  clientes: ClienteVM[];
}) {
  const hoy = todayISO();
  useAutoRefresh(60_000);

  const [weekAnchor, setWeekAnchor] = useState(hoy);
  const [pending, startTransition]  = useTransition();
  const [isAdding, setIsAdding]     = useState(false);
  const [newTitle, setNewTitle]     = useState("");
  const [fadingIds, setFadingIds]   = useState<Set<string>>(new Set());
  const calScrollRef                = useRef<HTMLDivElement>(null);

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
      calScrollRef.current.scrollTop = HOUR_H; // start at 07:00
    }
  }, []);

  // Week days
  const days = useMemo(() => weekDays(weekAnchor), [weekAnchor]);

  // Tasks for today
  const todayDow    = dowOf(hoy);
  const tareasHoy   = useMemo(() =>
    [...tasks]
      .filter((t) => taskShowToday(t, hoy, todayDow))
      .sort((a, b) => (a.isPriority === b.isPriority ? 0 : a.isPriority ? -1 : 1)),
  [tasks, hoy, todayDow]);

  // Reminders for today
  const recHoy = useMemo(() =>
    reminders.filter((r) => !r.done && r.whenISO.slice(0, 10) === hoy)
              .sort((a, b) => a.whenISO.localeCompare(b.whenISO)),
  [reminders, hoy]);

  // Coaching data
  const activos   = useMemo(() => clientesActivos(clientes), [clientes]);
  const revPend   = activos.filter((c) => c.revD !== null && c.revD <= 0);
  const conNotas  = activos.filter(hasNotas).slice(0, 3);

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
    fadeAndDo(`rev-${clienteId}`, () =>
      startTransition(() => { void marcarRevisionHecha(clienteId); })
    );
  }

  function handleAddTask() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await crearTarea({ title: newTitle.trim(), front: "personal", isPriority: false, date: hoy, recur: null });
      setNewTitle("");
      setIsAdding(false);
    });
  }

  // ── Calendar render ───────────────────────────────────────────────────────

  const calGrid = (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-white/[0.06]">
      {/* Sticky header: days */}
      <div className="flex shrink-0 border-b border-white/[0.06] bg-[#141414]">
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

      {/* Scrollable grid */}
      <div ref={calScrollRef} className="overflow-y-auto" style={{ maxHeight: "calc(100vh - 240px)" }}>
        <div className="relative flex" style={{ height: TOTAL_PX }}>
          {/* Time column */}
          <div className="w-10 shrink-0">
            {HOURS.map((h, i) => (
              <div key={h} className="absolute left-0 w-10 pr-2 text-right" style={{ top: i * HOUR_H + 3 }}>
                <span className="text-[9px] tabular-nums text-neutral-700">
                  {String(h).padStart(2, "0")}:00
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((iso, colIdx) => {
            const isToday      = iso === hoy;
            const { blocks, unicos } = eventsOn(iso, events, eventosUnicos);
            const hasRevision  = revPend.some(() => false); // placeholder — shown as subtle dot below
            const revClientes  = activos.filter((c) => c.revD !== null && c.revD <= 0 && c.proximaRevision === iso);

            return (
              <div key={iso} className={`relative flex-1 ${colIdx < 6 ? "border-r border-white/[0.04]" : ""} ${
                isToday ? "bg-[#C9A96E]/[0.025]" : ""
              }`}>
                {/* Hour lines */}
                {HOURS.map((_, i) => (
                  <div key={i} className="absolute inset-x-0 border-t border-white/[0.04]" style={{ top: i * HOUR_H }} />
                ))}

                {/* Half-hour lines */}
                {HOURS.map((_, i) => (
                  <div key={`h${i}`} className="absolute inset-x-0 border-t border-white/[0.02]" style={{ top: i * HOUR_H + HOUR_H / 2 }} />
                ))}

                {/* Recurring event blocks */}
                {blocks.map((ev) => {
                  const topMin  = Math.max(ev.startMin - H_START * 60, 0);
                  const top     = (topMin / 60) * HOUR_H + 1;
                  const botMin  = Math.min(ev.endMin - H_START * 60, HOURS.length * 60);
                  const height  = Math.max(((botMin - topMin) / 60) * HOUR_H - 2, 18);
                  const color   = FRONT_COLOR[ev.type];
                  return (
                    <div
                      key={ev.id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-0.5"
                      style={{ top, height, backgroundColor: color + "20", borderLeft: `2px solid ${color}` }}
                    >
                      <div className="truncate text-[10px] font-semibold leading-snug" style={{ color }}>
                        {ev.title}
                      </div>
                      {height > 30 && (
                        <div className="text-[9px] text-neutral-600">
                          {minToStr(ev.startMin)}–{minToStr(ev.endMin)}
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* One-time events */}
                {unicos.map((ev) => {
                  const topMin = Math.max(unikoMin(ev.startAt) - H_START * 60, 0);
                  const top    = (topMin / 60) * HOUR_H + 1;
                  const color  = FRONT_COLOR[ev.type];
                  return (
                    <div
                      key={ev.id}
                      className="absolute left-0.5 right-0.5 overflow-hidden rounded-md px-1.5 py-0.5"
                      style={{ top, height: 34, backgroundColor: color + "20", borderLeft: `2px solid ${color}` }}
                    >
                      <div className="truncate text-[10px] font-semibold leading-snug" style={{ color }}>
                        {ev.title}
                      </div>
                    </div>
                  );
                })}

                {/* Revisiones dot indicator */}
                {revClientes.map((c) => (
                  <div key={c.id}
                    title={`Rev: ${c.nombre}`}
                    className="absolute left-0.5 right-0.5 rounded-sm px-1 py-0.5"
                    style={{ top: 2, height: 14, backgroundColor: "#C9A96E18", borderLeft: "2px solid #C9A96E" }}
                  >
                    <div className="truncate text-[8.5px] font-semibold text-[#C9A96E]">{c.nombre.split(",")[0]}</div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ── Right list ────────────────────────────────────────────────────────────

  const rightList = (
    <div className="flex flex-col gap-6 overflow-y-auto" style={{ maxHeight: "calc(100vh - 200px)" }}>

      {/* Tareas */}
      {tareasHoy.length > 0 || isAdding ? (
        <div>
          <SectionLabel>Tareas</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {tareasHoy.map((t) => {
              const done = taskDoneOn(t, hoy);
              return (
                <FadeItem key={t.id} id={`task-${t.id}`} fadingIds={fadingIds}>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleCheckTask(t)}
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.03]"
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
                </FadeItem>
              );
            })}
          </div>
          <div className="mt-1.5">
            {isAdding ? (
              <div className="flex items-center gap-3 rounded-lg bg-white/[0.03] px-2.5 py-2">
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
                className="flex items-center gap-1.5 px-2.5 text-[11.5px] text-neutral-700 transition hover:text-neutral-400"
              >
                <span className="text-[14px] leading-none">+</span> Añadir tarea
              </button>
            )}
          </div>
        </div>
      ) : (
        <div>
          <SectionLabel>Tareas</SectionLabel>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-2.5 text-[11.5px] text-neutral-700 transition hover:text-neutral-400"
          >
            <span className="text-[14px] leading-none">+</span> Añadir tarea
          </button>
        </div>
      )}

      {/* Recordatorios */}
      {recHoy.length > 0 && (
        <div>
          <SectionLabel>Recordatorios</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {recHoy.map((r) => (
              <FadeItem key={r.id} id={`rem-${r.id}`} fadingIds={fadingIds}>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => handleCheckReminder(r)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition hover:bg-white/[0.03]"
                >
                  <CheckboxIcon checked={false} />
                  <BellIcon />
                  <span className="flex-1 text-[13px] font-medium text-[#e5e5e5]">{r.text}</span>
                  <span className="text-[10.5px] tabular-nums text-neutral-600">
                    {new Date(r.whenISO).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </button>
              </FadeItem>
            ))}
          </div>
        </div>
      )}

      {/* Revisiones pendientes */}
      {revPend.length > 0 && (
        <div>
          <SectionLabel>Revisiones pendientes</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {revPend.map((c) => (
              <FadeItem key={c.id} id={`rev-${c.id}`} fadingIds={fadingIds}>
                <div className="flex items-center gap-2 rounded-lg px-2.5 py-2">
                  <span className="text-[12px] leading-none text-red-400">•</span>
                  <span className="flex-1 text-[13px] font-medium text-[#e5e5e5]">{c.nombre}</span>
                  <span className="text-[11px] text-red-400">{Math.abs(c.revD ?? 0)}d vencida</span>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => handleRevisionHecha(c.id)}
                    className="ml-1 rounded-md bg-white/[0.06] px-2 py-1 text-[10.5px] text-neutral-400 transition hover:bg-white/[0.1] hover:text-neutral-200"
                  >
                    Marcar realizada
                  </button>
                </div>
              </FadeItem>
            ))}
          </div>
        </div>
      )}

      {/* Anotaciones recientes */}
      {conNotas.length > 0 && (
        <div>
          <SectionLabel>Anotaciones recientes</SectionLabel>
          <div className="flex flex-col gap-0.5">
            {conNotas.map((c) => {
              const snippet = CATEGORIAS.flatMap((cat) => c.notas[cat] ?? [])[0]?.texto ?? "";
              return (
                <div key={c.id} className="rounded-lg px-2.5 py-2">
                  <div className="flex items-baseline gap-2">
                    <span className="flex-1 text-[13px] font-medium text-[#e5e5e5]">{c.nombre}</span>
                    <Link href="/coaching/clientes" className="text-[10.5px] text-neutral-600 transition hover:text-neutral-400">
                      Ver cliente →
                    </Link>
                  </div>
                  {snippet && (
                    <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-relaxed text-neutral-600">{snippet}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden px-6 py-6">

      {/* Header */}
      <div className="mb-5 flex shrink-0 items-end gap-6">
        <div className="flex-1">
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

        {/* Week navigation */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setWeekAnchor((a) => addDaysLocal(a, -7))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 transition hover:bg-white/[0.06] hover:text-neutral-300"
          >
            <ChevronIcon dir="left" />
          </button>
          <button
            type="button"
            onClick={() => setWeekAnchor(hoy)}
            className="rounded-md px-2.5 py-1 text-[11px] text-neutral-600 transition hover:bg-white/[0.06] hover:text-neutral-300"
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => setWeekAnchor((a) => addDaysLocal(a, 7))}
            className="flex h-7 w-7 items-center justify-center rounded-md text-neutral-600 transition hover:bg-white/[0.06] hover:text-neutral-300"
          >
            <ChevronIcon dir="right" />
          </button>
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
    </div>
  );
}
