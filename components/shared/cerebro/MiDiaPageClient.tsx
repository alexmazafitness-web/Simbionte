"use client";

import { useTransition } from "react";
import { FRONT_LABEL, type Front } from "@/lib/personal/constants";
import { diffDiasDesdeHoy, dowOf, fmtDateCorta, minToStr, todayISO } from "@/lib/personal/format";
import { recurOccursOn } from "@/lib/personal/recurrence";
import { taskDoneOn, taskShowToday, type TaskVM } from "@/lib/personal/tasks";
import { marcarTareaHecha } from "@/lib/personal/tasks-actions";
import type { GoalVM } from "@/lib/personal/goal";
import type { EventBlockVM, MarkedDateVM } from "@/lib/personal/events";
import { FrontChip } from "./FrontChip";

const FRONT_ORDER: Record<Front, number> = { coaching: 0, contenido: 1, formacion: 2, personal: 3 };

export function MiDiaPageClient({
  tasks,
  goal,
  marks,
  events,
}: {
  tasks: TaskVM[];
  goal: GoalVM;
  marks: MarkedDateVM[];
  events: EventBlockVM[];
}) {
  const [pending, startTransition] = useTransition();
  const hoy = todayISO();
  const dow = dowOf(hoy);

  const hoyTexto = new Date().toLocaleDateString("es-ES", { weekday: "long", day: "2-digit", month: "long" });
  const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0;

  const proximaMarca = marks
    .map((m) => ({ ...m, dias: diffDiasDesdeHoy(m.date) ?? -1 }))
    .filter((m) => m.dias >= 0)
    .sort((a, b) => a.dias - b.dias)[0];

  const tareasHoy = [...tasks]
    .filter((t) => taskShowToday(t, hoy, dow))
    .sort((a, b) => {
      if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
      return (FRONT_ORDER[a.front] ?? 9) - (FRONT_ORDER[b.front] ?? 9);
    });

  const bloquesHoy = events.filter((e) => recurOccursOn(e.recur, hoy, dow)).sort((a, b) => a.startMin - b.startMin);

  const foco = tareasHoy.find((t) => t.front === "coaching") ?? tareasHoy[0] ?? null;

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
    });
  }

  return (
    <div className="mx-auto max-w-xl px-10 py-10">
      <p className="text-[11px] tracking-[0.2em] text-text-dim uppercase">{hoyTexto}</p>
      <h1 className="mt-1 font-display text-4xl text-gold">Mi día</h1>

      <div className="mt-6 rounded-2xl border border-line-soft bg-panel p-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="text-text-2">
            {goal.current.toLocaleString("es-ES")}€ de {goal.target.toLocaleString("es-ES")}€
          </span>
          <span className="font-semibold text-gold">{pct}%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-panel-3">
          <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {proximaMarca && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-gold-dim bg-gradient-to-br from-[rgba(201,169,110,.12)] to-transparent p-3">
          <div className="font-display text-3xl leading-none text-gold">{proximaMarca.dias === 0 ? "HOY" : proximaMarca.dias}</div>
          <div className="flex-1">
            <div className="text-[10px] tracking-wide text-text-dim uppercase">
              {proximaMarca.dias === 0 ? "Es el día" : proximaMarca.dias === 1 ? "día para" : "días para"}
            </div>
            <div className="text-[13px] font-medium">{proximaMarca.note || "Día marcado"}</div>
            <div className="text-[11px] text-text-dim">{fmtDateCorta(proximaMarca.date)}</div>
          </div>
        </div>
      )}

      {foco && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-line-soft bg-panel p-3.5">
          <div className="h-2 w-2 shrink-0 rounded-full bg-gold" />
          <div className="flex-1">
            <div className="text-[14px] font-medium">{foco.title}</div>
            <div className="text-[11px] text-text-dim">{FRONT_LABEL[foco.front]}</div>
          </div>
          <button
            type="button"
            disabled={pending}
            onClick={() => run(() => marcarTareaHecha(foco.id, !!foco.recur, hoy, true))}
            className="rounded-md bg-gold px-3 py-1.5 text-[12px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50"
          >
            Hecha
          </button>
        </div>
      )}

      <div className="mt-7">
        <div className="mb-2.5 flex items-center gap-2 text-[10px] tracking-[0.2em] text-gold-dim uppercase">
          Tareas de hoy
          <span className="text-text-dim">({tareasHoy.length})</span>
        </div>
        {tareasHoy.length === 0 ? (
          <p className="text-sm text-text-dim">Nada pendiente para hoy.</p>
        ) : (
          <div className="flex flex-col gap-1.5">
            {tareasHoy.map((t, i) => {
              const done = taskDoneOn(t, hoy);
              return (
                <div key={t.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-panel px-3.5 py-2.5">
                  <span className="w-5 shrink-0 font-display text-sm text-text-dim">{String(i + 1).padStart(2, "0")}</span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-[13.5px] ${done ? "text-text-dim line-through" : ""}`}>{t.title}</div>
                    <div className="mt-1 flex gap-1.5">
                      <FrontChip front={t.front} />
                      {t.isPriority && (
                        <span className="rounded-md bg-[rgba(201,169,110,.16)] px-2 py-0.5 text-[10.5px] font-semibold text-gold-bright">Prioritaria</span>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => run(() => marcarTareaHecha(t.id, !!t.recur, hoy, !done))}
                    className={`h-5 w-5 shrink-0 rounded-md border transition ${done ? "border-gold bg-gold" : "border-line"}`}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {bloquesHoy.length > 0 && (
        <div className="mt-7">
          <div className="mb-2.5 text-[10px] tracking-[0.2em] text-gold-dim uppercase">Hoy en el calendario</div>
          <div className="flex flex-col gap-1.5">
            {bloquesHoy.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg border-l-2 border-gold bg-panel px-3.5 py-2.5">
                <span className="text-[12px] font-semibold text-text-2">{minToStr(e.startMin)}</span>
                <span className="flex-1 text-[13px]">{e.title}</span>
                <FrontChip front={e.type} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
