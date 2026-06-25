"use client";

import { useState, useTransition } from "react";
import { Chip } from "@/components/ui/Chip";
import { FRONTS, FRONT_LABEL } from "@/lib/personal/constants";
import { todayISO } from "@/lib/personal/format";
import { recurLabel } from "@/lib/personal/recurrence";
import { DAYS_SH } from "@/lib/personal/constants";
import { fmtDateCorta, diffDiasDesdeHoy } from "@/lib/personal/format";
import { taskDoneOn, type TaskVM } from "@/lib/personal/tasks";
import { crearTarea, editarTarea, eliminarTarea, marcarTareaHecha, type TareaInput } from "@/lib/personal/tasks-actions";
import { FrontChip } from "./FrontChip";
import { TareaModal } from "./TareaModal";

type Filtro = "all" | "pri" | (typeof FRONTS)[number];

function whenLabel(t: TaskVM): string {
  if (t.date) {
    const d = diffDiasDesdeHoy(t.date) ?? 0;
    const rel = d === 0 ? "hoy" : d === 1 ? "mañana" : d > 1 ? `en ${d} días` : d === -1 ? "ayer · atrasada" : "atrasada";
    return `${fmtDateCorta(t.date)} · ${rel}`;
  }
  if (t.recur) return recurLabel(t.recur, DAYS_SH);
  return "Sin fecha";
}

export function TareasPageClient({ tasks }: { tasks: TaskVM[] }) {
  const [filtro, setFiltro] = useState<Filtro>("all");
  const [modal, setModal] = useState<null | "nuevo" | string>(null);
  const [pending, startTransition] = useTransition();
  const hoy = todayISO();

  let lista = tasks;
  if (filtro === "pri") lista = lista.filter((t) => t.isPriority);
  else if (filtro !== "all") lista = lista.filter((t) => t.front === filtro);

  const sorted = [...lista].sort((a, b) => {
    const da = taskDoneOn(a, hoy) ? 1 : 0;
    const db = taskDoneOn(b, hoy) ? 1 : 0;
    if (da !== db) return da - db;
    if (a.isPriority !== b.isPriority) return a.isPriority ? -1 : 1;
    return 0;
  });

  const tareaEditando = typeof modal === "string" ? tasks.find((t) => t.id === modal) ?? null : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5">
          <Chip active={filtro === "all"} onClick={() => setFiltro("all")}>
            Todas
          </Chip>
          <Chip active={filtro === "pri"} onClick={() => setFiltro("pri")}>
            Prioritarias
          </Chip>
          {FRONTS.map((f) => (
            <Chip key={f} active={filtro === f} onClick={() => setFiltro(f)}>
              {FRONT_LABEL[f]}
            </Chip>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setModal("nuevo")}
          className="ml-auto rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright"
        >
          + Nueva tarea
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
        {sorted.length === 0 ? (
          <p className="px-4 py-9 text-center text-text-dim">No hay tareas en este filtro.</p>
        ) : (
          sorted.map((t) => {
            const done = taskDoneOn(t, hoy);
            return (
              <div key={t.id} className="flex items-start gap-3 border-b border-line-soft px-4 py-3 last:border-b-0">
                <button
                  type="button"
                  onClick={() => run(() => marcarTareaHecha(t.id, !!t.recur, hoy, !done))}
                  className={`mt-0.5 h-[18px] w-[18px] shrink-0 rounded-md border transition ${
                    done ? "border-gold bg-gold" : "border-line"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className={`text-sm ${done ? "text-text-dim line-through" : ""}`}>{t.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <FrontChip front={t.front} />
                    {t.isPriority && (
                      <span className="rounded-md bg-[rgba(201,169,110,.16)] px-2 py-0.5 text-[10.5px] font-semibold text-gold-bright">
                        Prioritaria
                      </span>
                    )}
                    <span className="text-[11px] text-text-dim">{whenLabel(t)}</span>
                  </div>
                </div>
                <button type="button" onClick={() => setModal(t.id)} className="px-1.5 text-text-dim hover:text-gold-bright">
                  ✎
                </button>
                <button type="button" onClick={() => run(() => eliminarTarea(t.id))} className="px-1.5 text-text-dim hover:text-bad">
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>

      <TareaModal
        open={modal !== null}
        onClose={() => setModal(null)}
        tarea={tareaEditando}
        pending={pending}
        onSubmit={(input: TareaInput) =>
          run(() => (tareaEditando ? editarTarea(tareaEditando.id, input) : crearTarea(input)), () => setModal(null))
        }
      />
    </div>
  );
}
