"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Lead } from "@/lib/coaching/leads";
import type { LeadInput } from "@/lib/coaching/leads-actions";
import type { LeadContextoVM } from "@/lib/coaching/lead-contexto";
import { PrepararLlamada } from "./PrepararLlamada";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function LeadModal({
  open,
  onClose,
  lead,
  contexto,
  pending,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  lead: Lead | null;
  contexto?: LeadContextoVM | null;
  pending: boolean;
  onSave: (input: LeadInput) => void;
  onDelete?: () => void;
}) {
  const [nombre, setNombre] = useState(lead?.nombre ?? "");
  const [contacto, setContacto] = useState(lead?.contacto ?? "");
  const [origen, setOrigen] = useState(lead?.origen ?? "");
  const [nota, setNota] = useState(lead?.nota ?? "");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!nombre.trim()) return;
    onSave({ nombre: nombre.trim(), contacto: contacto.trim(), origen: origen.trim(), nota: nota.trim() });
  }

  return (
    <Modal open={open} onClose={onClose} title={lead ? "Editar lead" : "Nuevo lead"} widthClassName="w-[560px]">
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Contacto</label>
            <input
              className={inputClass}
              placeholder="Teléfono / Instagram"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Fuente</label>
            <input
              className={inputClass}
              placeholder="Instagram, recomendación…"
              value={origen}
              onChange={(e) => setOrigen(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nota</label>
          <input className={inputClass} value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            {lead ? "Guardar" : "Crear lead"}
          </button>
        </div>
        {lead && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]"
          >
            Eliminar lead
          </button>
        )}
      </form>

      {lead && <PrepararLlamada leadId={lead.id} contexto={contexto ?? null} />}
    </Modal>
  );
}
