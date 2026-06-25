"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { FASES_LLAMADA } from "@/lib/coaching/ventas-constants";
import type { LlamadaInput } from "@/lib/coaching/ventas-actions";
import type { Lead } from "@/lib/coaching/leads";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function LlamadaModal({
  open,
  onClose,
  leads,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  leads: Lead[];
  pending: boolean;
  onSubmit: (input: LlamadaInput) => void;
}) {
  const [leadId, setLeadId] = useState("");
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [fase, setFase] = useState("");
  const [resultado, setResultado] = useState("");
  const [notas, setNotas] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!leadId || !fecha) return;
    onSubmit({
      leadId,
      fecha,
      faseAlcanzada: (fase || null) as LlamadaInput["faseAlcanzada"],
      resultado,
      notas,
    });
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar llamada">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Lead</label>
          <select className={inputClass} value={leadId} onChange={(e) => setLeadId(e.target.value)} autoFocus>
            <option value="" disabled>
              Selecciona un lead…
            </option>
            {leads.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fecha</label>
            <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fase alcanzada</label>
            <select className={inputClass} value={fase} onChange={(e) => setFase(e.target.value)}>
              <option value="">—</option>
              {FASES_LLAMADA.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.numero} · {f.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Resultado</label>
          <select className={inputClass} value={resultado} onChange={(e) => setResultado(e.target.value)}>
            <option value="">—</option>
            <option value="Cerrado">Cerrado</option>
            <option value="Se lo piensa">Se lo piensa</option>
            <option value="Objeción precio">Objeción precio</option>
            <option value="No-show">No-show</option>
            <option value="Reagendada">Reagendada</option>
            <option value="Descartado">Descartado</option>
          </select>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Notas</label>
          <textarea rows={3} className={inputClass} value={notas} onChange={(e) => setNotas(e.target.value)} />
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
