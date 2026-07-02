"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FRONTS, FRONT_LABEL, type Front } from "@/lib/personal/constants";
import { todayISO, toISO } from "@/lib/personal/format";
import type { ReminderVM } from "@/lib/personal/reminders";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function RecordatorioModal({
  open,
  onClose,
  recordatorio,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  recordatorio: ReminderVM | null;
  pending: boolean;
  onSubmit: (text: string, whenISO: string, front: Front) => void;
}) {
  // IMPORTANTE: usar siempre hora local, nunca UTC. whenISO es un timestamp UTC;
  // al editar se muestran fecha/hora en la zona local del navegador (no con
  // slice() sobre el ISO, que devolvería la fecha/hora UTC — el bug original).
  const rd = recordatorio ? new Date(recordatorio.whenISO) : null;
  const initialDate = rd ? toISO(rd) : todayISO();
  const initialTime = rd
    ? `${String(rd.getHours()).padStart(2, "0")}:${String(rd.getMinutes()).padStart(2, "0")}`
    : "09:00";

  const [text, setText] = useState(recordatorio?.text ?? "");
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [front, setFront] = useState<Front>(recordatorio?.front ?? "personal");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !date || !time) return;
    onSubmit(text.trim(), new Date(`${date}T${time}`).toISOString(), front);
  }

  return (
    <Modal open={open} onClose={onClose} title={recordatorio ? "Editar recordatorio" : "Nuevo recordatorio"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Recordatorio</label>
          <input className={inputClass} value={text} onChange={(e) => setText(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha</label>
            <input type="date" className={inputClass} value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Hora</label>
            <input type="time" className={inputClass} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
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
