"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Recurrencia } from "@/lib/coaching/constants";
import { todayISO } from "@/lib/coaching/format";
import type { GestionMesocicloInput } from "@/lib/coaching/clientes-actions";
import type { GrupoRevision } from "@/lib/coaching/grupos";
import type { Tarifa } from "@/lib/coaching/tarifas";

const inputClass =
  "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim appearance-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5">
      <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">{label}</label>
      {children}
    </div>
  );
}

// Cada tarifa ya lleva su recurrencia fija (115€→Mensual, etc.) — un solo
// desplegable selecciona ambas a la vez en vez de pedirlas por separado.
function TarifaSelect({ tarifas, value, onChange }: { tarifas: Tarifa[]; value: string; onChange: (tarifaId: string) => void }) {
  return (
    <select className={inputClass} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="" disabled></option>
      {tarifas.map((t) => (
        <option key={t.id} value={t.id}>
          {t.precio} € · {t.recurrencia}
        </option>
      ))}
    </select>
  );
}

function ModalActions({ onCancel, submitLabel, danger, disabled }: { onCancel: () => void; submitLabel: string; danger?: boolean; disabled?: boolean }) {
  return (
    <div className="mt-2 flex gap-2.5">
      <button type="button" onClick={onCancel} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
        Cancelar
      </button>
      <button
        type="submit"
        disabled={disabled}
        className={`flex-1 rounded-lg py-2.5 text-[13.5px] font-semibold transition disabled:opacity-50 ${
          danger ? "bg-bad text-white" : "bg-gold text-[#1a1208] hover:bg-gold-bright"
        }`}
      >
        {submitLabel}
      </button>
    </div>
  );
}

export function NuevoClienteModal({
  open,
  onClose,
  tarifas,
  grupos,
  leadNombre,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  tarifas: Tarifa[];
  grupos: GrupoRevision[];
  leadNombre?: string;
  pending: boolean;
  onSubmit: (input: { nombre: string; cuota: number; recurrencia: Recurrencia; grupoCodigo: string }) => void;
}) {
  const [nombre, setNombre] = useState(leadNombre ?? "");
  const [tarifaId, setTarifaId] = useState("");
  const [grupoCodigo, setGrupoCodigo] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tarifa = tarifas.find((t) => t.id === tarifaId);
    if (!nombre.trim() || !tarifa || !grupoCodigo) return;
    onSubmit({ nombre: nombre.trim(), cuota: tarifa.precio, recurrencia: tarifa.recurrencia, grupoCodigo });
  }

  return (
    <Modal open={open} onClose={onClose} title={leadNombre ? "Convertir lead a cliente" : "Nuevo cliente"}>
      <form onSubmit={handleSubmit}>
        <Field label="Nombre">
          <input className={inputClass} value={nombre} onChange={(e) => setNombre(e.target.value)} autoFocus />
        </Field>
        <Field label="Tarifa">
          <TarifaSelect tarifas={tarifas} value={tarifaId} onChange={setTarifaId} />
        </Field>
        <Field label="Grupo de revisión">
          <select className={inputClass} value={grupoCodigo} onChange={(e) => setGrupoCodigo(e.target.value)}>
            <option value="" disabled></option>
            {grupos.map((g) => (
              <option key={g.id} value={g.codigo}>
                {g.codigo} · {g.nombre}
              </option>
            ))}
          </select>
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Crear cliente" disabled={pending} />
      </form>
    </Modal>
  );
}

export function ReactivarModal({
  open,
  onClose,
  nombre,
  tarifas,
  grupos,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  nombre: string;
  tarifas: Tarifa[];
  grupos: GrupoRevision[];
  pending: boolean;
  onSubmit: (input: { cuota: number; recurrencia: Recurrencia; grupoCodigo: string }) => void;
}) {
  const [tarifaId, setTarifaId] = useState("");
  const [grupoCodigo, setGrupoCodigo] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const tarifa = tarifas.find((t) => t.id === tarifaId);
    if (!tarifa || !grupoCodigo) return;
    onSubmit({ cuota: tarifa.precio, recurrencia: tarifa.recurrencia, grupoCodigo });
  }

  return (
    <Modal open={open} onClose={onClose} title={`Reactivar a ${nombre}`}>
      <form onSubmit={handleSubmit}>
        <Field label="Tarifa">
          <TarifaSelect tarifas={tarifas} value={tarifaId} onChange={setTarifaId} />
        </Field>
        <Field label="Grupo de revisión">
          <select className={inputClass} value={grupoCodigo} onChange={(e) => setGrupoCodigo(e.target.value)}>
            <option value="" disabled></option>
            {grupos.map((g) => (
              <option key={g.id} value={g.codigo}>
                {g.codigo} · {g.nombre}
              </option>
            ))}
          </select>
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Reactivar cliente" disabled={pending} />
      </form>
    </Modal>
  );
}

export function BajaModal({
  open,
  onClose,
  nombre,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  nombre: string;
  pending: boolean;
  onSubmit: (fecha: string, motivo: string) => void;
}) {
  const [fecha, setFecha] = useState(todayISO());
  const [motivo, setMotivo] = useState("");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(fecha, motivo.trim());
  }

  return (
    <Modal open={open} onClose={onClose} title={`Dar de baja a ${nombre}`}>
      <form onSubmit={handleSubmit}>
        <Field label="Fecha de baja">
          <input type="date" className={inputClass} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Field>
        <Field label="Motivo">
          <input className={inputClass} value={motivo} onChange={(e) => setMotivo(e.target.value)} />
        </Field>
        <ModalActions onCancel={onClose} submitLabel="Dar de baja" danger disabled={pending} />
      </form>
    </Modal>
  );
}

export function EliminarConfirmModal({
  open,
  onClose,
  nombre,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  nombre: string;
  pending: boolean;
  onConfirm: () => void;
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Eliminar a ${nombre}`}>
      <p className="mb-5 text-[13.5px] leading-relaxed text-text-2">
        Esto borra al cliente de forma permanente — notas, histórico y LTV incluidos. No se puede deshacer. ¿Seguro?
      </p>
      <div className="flex gap-2.5">
        <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
          Cancelar
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="flex-1 rounded-lg bg-bad py-2.5 text-[13.5px] font-semibold text-white disabled:opacity-50"
        >
          Eliminar definitivamente
        </button>
      </div>
    </Modal>
  );
}

export function MesoModal({
  open,
  onClose,
  nombre,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  nombre: string;
  pending: boolean;
  onSubmit: (input: GestionMesocicloInput) => void;
}) {
  const [accion, setAccion] = useState("");
  const [extra, setExtra] = useState("2");
  const [numero, setNumero] = useState("6");
  const [dias, setDias] = useState("7");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (accion === "ampliar") {
      const extraN = parseInt(extra) || 0;
      if (extraN <= 0) return;
      onSubmit({ accion: "ampliar", extraMicrociclos: extraN });
    } else if (accion === "nuevo") {
      onSubmit({ accion: "nuevo", numeroMicrociclos: parseInt(numero) || 6, diasMicrociclo: parseInt(dias) || 7 });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={`Gestionar mesociclo · ${nombre}`}>
      <form onSubmit={handleSubmit}>
        <Field label="¿Qué quieres hacer?">
          <select className={inputClass} value={accion} onChange={(e) => setAccion(e.target.value)}>
            <option value="" disabled></option>
            <option value="ampliar">Añadir microciclos al actual</option>
            <option value="nuevo">Cerrar y empezar mesociclo nuevo</option>
          </select>
        </Field>
        {accion === "ampliar" && (
          <Field label="Microciclos a añadir">
            <input type="number" min={1} className={inputClass} value={extra} onChange={(e) => setExtra(e.target.value)} />
          </Field>
        )}
        {accion === "nuevo" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nº microciclos">
              <input type="number" min={1} className={inputClass} value={numero} onChange={(e) => setNumero(e.target.value)} />
            </Field>
            <Field label="Días por microciclo">
              <input type="number" min={1} className={inputClass} value={dias} onChange={(e) => setDias(e.target.value)} />
            </Field>
          </div>
        )}
        <ModalActions onCancel={onClose} submitLabel="Confirmar" disabled={pending || !accion} />
      </form>
    </Modal>
  );
}
