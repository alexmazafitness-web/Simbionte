"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FRONTS, FRONT_LABEL, type Front } from "@/lib/personal/constants";
import { todayISO } from "@/lib/personal/format";
import type { RecurRule } from "@/lib/personal/recurrence";
import type { TaskVM } from "@/lib/personal/tasks";
import type { TareaInput } from "@/lib/personal/tasks-actions";
import { RecurrencePicker } from "./RecurrencePicker";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

type Modo = "date" | "recur" | "none";

export function TareaModal({
  open,
  onClose,
  tarea,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  tarea: TaskVM | null;
  pending: boolean;
  onSubmit: (input: TareaInput) => void;
}) {
  const [title, setTitle] = useState(tarea?.title ?? "");
  const [front, setFront] = useState<Front>(tarea?.front ?? "coaching");
  const [isPriority, setIsPriority] = useState(tarea?.isPriority ?? false);
  const [modo, setModo] = useState<Modo>(tarea?.date ? "date" : tarea?.recur ? "recur" : tarea ? "none" : "date");
  const [date, setDate] = useState(tarea?.date ?? todayISO());
  const [recur, setRecur] = useState<RecurRule | null>(tarea?.recur ?? null);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (modo === "date" && !date) return;
    if (modo === "recur" && !recur) return;
    onSubmit({
      title: title.trim(),
      front,
      isPriority,
      date: modo === "date" ? date : null,
      recur: modo === "recur" ? recur : null,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={tarea ? "Editar tarea" : "Nueva tarea"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Tarea</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Frente</label>
          <select className={inputClass} value={front} onChange={(e) => setFront(e.target.value as Front)}>
            {FRONTS.map((f) => (
              <option key={f} value={f}>
                {FRONT_LABEL[f]}
              </option>
            ))}
          </select>
        </div>

        <label className="mb-3.5 flex items-center gap-2 text-[13px] text-text-2">
          <input type="checkbox" checked={isPriority} onChange={(e) => setIsPriority(e.target.checked)} />
          Prioritaria (aparece siempre en Mi día)
        </label>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Cuándo</label>
          <div className="flex gap-2">
            {(["date", "recur", "none"] as Modo[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setModo(m)}
                className={`flex-1 rounded-lg py-2 text-[13px] transition ${
                  modo === m ? "bg-[rgba(201,169,110,.16)] text-gold-bright" : "border border-line text-text-2"
                }`}
              >
                {m === "date" ? "Fecha concreta" : m === "recur" ? "Recurrente" : "Sin fecha"}
              </button>
            ))}
          </div>
        </div>

        {modo === "date" && (
          <div className="mb-3.5">
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha</label>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        )}

        {modo === "recur" && (
          <div className="mb-3.5">
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Se repite</label>
            <RecurrencePicker value={recur} onChange={setRecur} />
          </div>
        )}

        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
