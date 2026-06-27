"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { crearTarea, marcarTareaHecha } from "@/lib/personal/tasks-actions";
import { taskDoneOn, taskOccursOn, taskShowToday, type TaskVM } from "@/lib/personal/tasks";
import { dowOf, minToStr, todayISO } from "@/lib/personal/format";
import { recordatoriosHoy } from "@/lib/personal/reminders";
import { recurOccursOn } from "@/lib/personal/recurrence";
import { calcularMRR, clientesActivos, hasNotas, type ClienteVM } from "@/lib/coaching/clientes";
import { CATEGORIAS } from "@/lib/coaching/constants";
import type { GoalVM } from "@/lib/personal/goal";
import type { EventBlockVM } from "@/lib/personal/events";
import type { ReminderVM } from "@/lib/personal/reminders";

// ── Week helpers ──────────────────────────────────────────────────────────────

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

function getWeekDays(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const today = new Date(y, m - 1, d);
  const dow = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(monday);
    dt.setDate(monday.getDate() + i);
    const yy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const dd = String(dt.getDate()).padStart(2, "0");
    return { iso: `${yy}-${mm}-${dd}`, label: DAY_LABELS[i], num: dt.getDate() };
  });
}

// ── Sub-icons ─────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
      className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`}>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function CheckMark() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}
      className="h-full w-full stroke-[#1a1208] p-[3px]">
      <path d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ── Motivation messages ───────────────────────────────────────────────────────

const MOTIVATION = [
  "Día despejado. Buen momento para crear.",
  "Sin pendientes. Todo al día.",
  "Agenda libre. Aprovecha el espacio.",
];

// ── Main component ────────────────────────────────────────────────────────────

export function MiDiaPageClient({
  tasks,
  goal,
  events,
  reminders,
  clientes,
}: {
  tasks: TaskVM[];
  goal: GoalVM;
  events: EventBlockVM[];
  reminders: ReminderVM[];
  clientes: ClienteVM[];
}) {
  const hoy = todayISO();

  const [selectedDay, setSelectedDay]   = useState(hoy);
  const [pending, startTransition]      = useTransition();
  const [isAdding, setIsAdding]         = useState(false);
  const [newTitle, setNewTitle]         = useState("");
  const [openCoach, setOpenCoach]       = useState({ revisiones: true, mesociclos: true, notas: true });
  const addInputRef = useRef<HTMLInputElement>(null);

  const weekDays = useMemo(() => getWeekDays(hoy), [hoy]);

  // Header
  const hoyTexto = new Date(hoy + "T12:00:00").toLocaleDateString("es-ES", {
    weekday: "long", day: "numeric", month: "long",
  });
  const mrr = useMemo(() => calcularMRR(clientes), [clientes]);
  const pct = goal.target > 0 ? Math.min(100, (mrr / goal.target) * 100) : 0;

  // Tasks for selected day
  const selDow = dowOf(selectedDay);
  const tareasDelDia = useMemo(() => [...tasks]
    .filter((t) =>
      selectedDay === hoy
        ? taskShowToday(t, hoy, selDow)
        : taskOccursOn(t, selectedDay, selDow),
    )
    .sort((a, b) => (a.isPriority === b.isPriority ? 0 : a.isPriority ? -1 : 1)),
  [tasks, selectedDay, hoy, selDow]);

  // Reminders (only for today)
  const recHoy = useMemo(
    () => (selectedDay === hoy ? recordatoriosHoy(reminders) : []),
    [reminders, selectedDay, hoy],
  );

  // Calendar events for selected day
  const eventosDelDia = useMemo(
    () => events.filter((e) => e.recur && recurOccursOn(e.recur, selectedDay, selDow))
               .sort((a, b) => a.startMin - b.startMin),
    [events, selectedDay, selDow],
  );

  // Week strip dots
  function dayHasDot(iso: string) {
    const dw = dowOf(iso);
    return (
      tasks.some((t) => !taskDoneOn(t, iso) && taskOccursOn(t, iso, dw)) ||
      events.some((e) => e.recur && recurOccursOn(e.recur, iso, dw))
    );
  }

  // Coaching data
  const activos     = useMemo(() => clientesActivos(clientes), [clientes]);
  const revPend     = activos.filter((c) => c.revD !== null && c.revD <= 0);
  const mesoRenov   = activos.filter(
    (c) => c.mesociclo && (
      c.mesociclo.estado !== "EN_CURSO" ||
      (c.mesociclo.diasRestantes !== null && c.mesociclo.diasRestantes >= 0 && c.mesociclo.diasRestantes <= 7)
    ),
  );
  const conNotas    = activos.filter(hasNotas).slice(0, 3);
  const hasCoaching = revPend.length > 0 || mesoRenov.length > 0 || conNotas.length > 0;

  // Actions
  function handleCheck(t: TaskVM) {
    const done = taskDoneOn(t, selectedDay);
    startTransition(() => { void marcarTareaHecha(t.id, !!t.recur, selectedDay, !done); });
  }

  function handleAddTask() {
    if (!newTitle.trim()) return;
    startTransition(async () => {
      await crearTarea({ title: newTitle.trim(), front: "personal", isPriority: false, date: selectedDay, recur: null });
      setNewTitle("");
      setIsAdding(false);
    });
  }

  const selLabel = selectedDay === hoy
    ? "hoy"
    : new Date(selectedDay + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric" });

  // ── Render ──────────────────────────────────────────────────────────────────

  const weekStrip = (
    <div className="flex rounded-2xl bg-[#181818] p-1.5">
      {weekDays.map(({ iso, label, num }) => {
        const isToday    = iso === hoy;
        const isPast     = iso < hoy;
        const isSelected = iso === selectedDay;
        const hasDot     = dayHasDot(iso);
        return (
          <button
            key={iso}
            type="button"
            onClick={() => setSelectedDay(iso)}
            className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 transition ${
              isPast && !isSelected ? "opacity-30" : ""
            } ${isSelected && !isToday ? "bg-white/[0.05]" : ""} hover:opacity-100`}
          >
            <span className="text-[8.5px] font-bold uppercase tracking-widest text-neutral-700">{label}</span>
            <span
              className={`font-display text-[21px] leading-none ${
                isToday
                  ? "flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#C9A96E] text-[17px] text-[#1a1208]"
                  : isSelected ? "text-neutral-100" : "text-neutral-500"
              }`}
            >
              {num}
            </span>
            <span className={`h-[5px] w-[5px] rounded-full transition-opacity ${hasDot ? "bg-[#C9A96E] opacity-60" : "opacity-0"}`} />
          </button>
        );
      })}
    </div>
  );

  const tasksList = (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-neutral-600">
          Tareas{selectedDay !== hoy ? ` · ${selLabel}` : ""}
        </h2>
        <span className="h-px flex-1 bg-neutral-800/60" />
        <Link href="/personal/cerebro/tareas" className="text-[11px] text-neutral-700 transition hover:text-neutral-400">
          Ver todas →
        </Link>
      </div>

      {(eventosDelDia.length > 0 || recHoy.length > 0) && (
        <div className="mb-4 flex flex-col gap-1">
          {eventosDelDia.map((e) => (
            <div key={e.id} className="flex items-center gap-3 border-l-[2px] border-neutral-800 py-1 pl-3">
              <span className="text-[10.5px] tabular-nums text-neutral-700">{minToStr(e.startMin)}</span>
              <span className="text-[12.5px] text-neutral-500">{e.title}</span>
            </div>
          ))}
          {recHoy.map((r) => (
            <div key={r.id} className="flex items-center gap-3 border-l-[2px] border-neutral-800 py-1 pl-3">
              <span className="text-[10.5px] tabular-nums text-neutral-700">
                {new Date(r.whenISO).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
              </span>
              <span className="text-[12.5px] text-neutral-500">{r.text}</span>
            </div>
          ))}
        </div>
      )}

      {tareasDelDia.length === 0 ? (
        <p className="py-1 text-[13px] italic text-neutral-700">{MOTIVATION[0]}</p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {tareasDelDia.map((t) => {
            const done = taskDoneOn(t, selectedDay);
            return (
              <div
                key={t.id}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition ${done ? "opacity-40" : "bg-[#1c1c1c]"}`}
              >
                <button
                  type="button"
                  onClick={() => handleCheck(t)}
                  disabled={pending}
                  className={`h-[18px] w-[18px] shrink-0 rounded-[4px] border transition ${
                    done ? "border-[#C9A96E] bg-[#C9A96E]" : "border-neutral-700 hover:border-neutral-500"
                  }`}
                >
                  {done && <CheckMark />}
                </button>
                <span className={`flex-1 text-[13.5px] leading-snug ${done ? "text-neutral-600 line-through" : "text-neutral-200"}`}>
                  {t.title}
                </span>
                {t.isPriority && !done && <span className="text-[11px] text-[#C9A96E] opacity-50">★</span>}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-3">
        {isAdding ? (
          <div className="flex items-center gap-3 rounded-xl bg-[#1c1c1c] px-3.5 py-2.5">
            <div className="h-[18px] w-[18px] shrink-0 rounded-[4px] border border-neutral-700" />
            <input
              ref={addInputRef}
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleAddTask();
                if (e.key === "Escape") { setIsAdding(false); setNewTitle(""); }
              }}
              placeholder="Nombre de la tarea…"
              className="flex-1 bg-transparent text-[13.5px] text-neutral-200 outline-none placeholder:text-neutral-700"
            />
            <button
              type="button"
              onClick={handleAddTask}
              disabled={!newTitle.trim() || pending}
              className="text-[11.5px] font-semibold text-[#C9A96E] transition disabled:opacity-30"
            >
              Añadir
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 text-[12px] text-neutral-700 transition hover:text-neutral-400"
          >
            <span className="text-[15px] leading-none">+</span> Añadir tarea
          </button>
        )}
      </div>
    </div>
  );

  const coachingPanel = hasCoaching ? (
    <div className="flex flex-col gap-1">
      <div className="flex flex-col divide-y divide-neutral-800/60">

        {revPend.length > 0 && (
          <div className="py-3">
            <button
              type="button"
              onClick={() => setOpenCoach((p) => ({ ...p, revisiones: !p.revisiones }))}
              className="flex w-full items-center gap-2 text-left"
            >
              <span className="flex-1 text-[12.5px] text-neutral-400">Revisiones pendientes</span>
              <span className="text-[11px] tabular-nums text-neutral-600">{revPend.length}</span>
              <Chevron open={openCoach.revisiones} />
            </button>
            {openCoach.revisiones && (
              <div className="mt-2 flex flex-col gap-0.5">
                {revPend.map((c) => (
                  <Link key={c.id} href="/coaching/revisiones"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition hover:bg-[#1c1c1c]"
                  >
                    <span className="flex-1 text-neutral-300">{c.nombre}</span>
                    <span className="text-[11px] text-red-500/70">{Math.abs(c.revD ?? 0)}d vencida</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {mesoRenov.length > 0 && (
          <div className="py-3">
            <button
              type="button"
              onClick={() => setOpenCoach((p) => ({ ...p, mesociclos: !p.mesociclos }))}
              className="flex w-full items-center gap-2 text-left"
            >
              <span className="flex-1 text-[12.5px] text-neutral-400">Mesociclos a renovar</span>
              <span className="text-[11px] tabular-nums text-neutral-600">{mesoRenov.length}</span>
              <Chevron open={openCoach.mesociclos} />
            </button>
            {openCoach.mesociclos && (
              <div className="mt-2 flex flex-col gap-0.5">
                {mesoRenov.map((c) => (
                  <Link key={c.id} href="/coaching/mesociclos"
                    className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition hover:bg-[#1c1c1c]"
                  >
                    <span className="flex-1 text-neutral-300">{c.nombre}</span>
                    <span className="text-[11px] text-neutral-600">
                      {c.mesociclo?.estado !== "EN_CURSO" ? "Vencido" : `${c.mesociclo.diasRestantes}d restantes`}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {conNotas.length > 0 && (
          <div className="py-3">
            <button
              type="button"
              onClick={() => setOpenCoach((p) => ({ ...p, notas: !p.notas }))}
              className="flex w-full items-center gap-2 text-left"
            >
              <span className="flex-1 text-[12.5px] text-neutral-400">Anotaciones recientes</span>
              <span className="text-[11px] tabular-nums text-neutral-600">{conNotas.length}</span>
              <Chevron open={openCoach.notas} />
            </button>
            {openCoach.notas && (
              <div className="mt-2 flex flex-col gap-0.5">
                {conNotas.map((c) => {
                  const snippet = CATEGORIAS.flatMap((cat) => c.notas[cat] ?? [])[0]?.texto ?? "";
                  return (
                    <Link key={c.id} href="/coaching/clientes"
                      className="flex flex-col rounded-lg px-2.5 py-2 transition hover:bg-[#1c1c1c]"
                    >
                      <span className="text-[13px] text-neutral-300">{c.nombre}</span>
                      {snippet && <span className="mt-0.5 line-clamp-1 text-[11.5px] text-neutral-700">{snippet}</span>}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  ) : null;

  return (
    <div className="flex h-full gap-0 px-8 py-10 md:gap-10">

      {/* ── Columna izquierda (60%) ── */}
      <div className="flex w-full flex-col gap-8 md:w-3/5">
        {/* Fecha + MRR */}
        <div>
          <h1 className="font-heading text-[34px] font-semibold capitalize leading-tight">
            {hoyTexto}
          </h1>
          <div className="mt-2.5">
            <span className="text-[12px] tabular-nums text-neutral-600">
              {mrr.toLocaleString("es-ES")}€ · {Math.round(pct)}%
            </span>
            <div className="mt-1.5 h-[2px] overflow-hidden rounded-full bg-neutral-800/80">
              <div
                className="h-full rounded-full bg-[#C9A96E] transition-[width] duration-700"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Strip semanal — ancho completo de la columna */}
        {weekStrip}

        {/* Tareas */}
        {tasksList}
      </div>

      {/* ── Columna derecha (40%) ── */}
      <div className="hidden w-2/5 flex-col gap-8 md:flex">
        {/* Coaching */}
        {hasCoaching && (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-neutral-600">Coaching</h2>
              <span className="h-px flex-1 bg-neutral-800/60" />
            </div>
            {coachingPanel}
          </>
        )}
      </div>

      {/* ── Mobile: Coaching apilado debajo de las tareas ── */}
      <div className="mt-2 flex flex-col gap-8 md:hidden">
        {hasCoaching && (
          <>
            <div className="flex items-center gap-2">
              <h2 className="text-[10.5px] font-bold uppercase tracking-widest text-neutral-600">Coaching</h2>
              <span className="h-px flex-1 bg-neutral-800/60" />
            </div>
            {coachingPanel}
          </>
        )}
      </div>

    </div>
  );
}
