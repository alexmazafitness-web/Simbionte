"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { todayISO } from "@/lib/personal/format";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function AgendarLlamadaModal({
  open,
  onClose,
  nombreLead,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  nombreLead: string;
  pending: boolean;
  onSubmit: (fecha: string, hora: string) => void;
}) {
  const [fecha, setFecha] = useState(todayISO());
  const [hora, setHora] = useState("12:00");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!fecha || !hora) return;
    onSubmit(fecha, hora);
  }

  return (
    <Modal open={open} onClose={onClose} title={`Agendar llamada · ${nombreLead}`}>
      <form onSubmit={handleSubmit}>
        <p className="mb-3.5 text-[12.5px] leading-relaxed text-text-dim">
          Se creará un evento de 30 min en tu Calendario con este lead. Si cancelas, el lead se queda en su etapa actual.
        </p>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha</label>
            <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} autoFocus />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Hora</label>
            <input type="time" className={inputClass} value={hora} onChange={(e) => setHora(e.target.value)} />
          </div>
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Agendar
          </button>
        </div>
      </form>
    </Modal>
  );
}
