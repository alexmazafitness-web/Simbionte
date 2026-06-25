"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FRONTS, FRONT_LABEL, type Front } from "@/lib/personal/constants";
import { timeToMin, minToStr } from "@/lib/personal/format";
import type { RecurRule } from "@/lib/personal/recurrence";
import type { EventBlockVM } from "@/lib/personal/events";
import type { BloqueInput } from "@/lib/personal/events-actions";
import { RecurrencePicker } from "./RecurrencePicker";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function BloqueModal({
  open,
  onClose,
  bloque,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  bloque: EventBlockVM | null;
  pending: boolean;
  onSubmit: (input: BloqueInput) => void;
  onDelete?: () => void;
}) {
  const [title, setTitle] = useState(bloque?.title ?? "");
  const [type, setType] = useState<Front>(bloque?.type ?? "coaching");
  const [startStr, setStartStr] = useState(bloque ? minToStr(bloque.startMin) : "09:00");
  const [endStr, setEndStr] = useState(bloque ? minToStr(bloque.endMin) : "10:00");
  const [notes, setNotes] = useState(bloque?.notes ?? "");
  const [recur, setRecur] = useState<RecurRule | null>(bloque?.recur ?? { days: [new Date().getDay()], start: null, endType: "never" });

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !recur || !startStr || !endStr) return;
    onSubmit({
      title: title.trim(),
      startMin: timeToMin(startStr),
      endMin: timeToMin(endStr),
      type,
      notes,
      recur,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title={bloque ? "Editar bloque" : "Añadir bloque"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Tipo</label>
          <div className="flex flex-wrap gap-1.5">
            {FRONTS.map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setType(f)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] transition ${
                  type === f ? "bg-[rgba(201,169,110,.16)] text-gold-bright" : "border border-line text-text-2"
                }`}
              >
                {FRONT_LABEL[f]}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">¿Qué es?</label>
          <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>

        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Hora inicio</label>
            <input type="time" className={inputClass} value={startStr} onChange={(e) => setStartStr(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Hora fin</label>
            <input type="time" className={inputClass} value={endStr} onChange={(e) => setEndStr(e.target.value)} />
          </div>
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Notas (opcional)</label>
          <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>

        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Días que se repite</label>
          <RecurrencePicker value={recur} onChange={setRecur} />
        </div>

        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
        {bloque && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]"
          >
            Eliminar bloque
          </button>
        )}
      </form>
    </Modal>
  );
}
