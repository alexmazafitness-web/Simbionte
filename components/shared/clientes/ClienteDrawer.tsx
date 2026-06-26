"use client";

import { useState } from "react";
import type { ClienteVM } from "@/lib/coaching/clientes";
import { CATEGORIA_LABEL, CATEGORIAS, type Categoria } from "@/lib/coaching/constants";
import { fmtDateCorta } from "@/lib/coaching/format";
import { Pill } from "@/components/ui/Pill";
import { MesoPill, PagoPill, RevisionPill } from "./statusPills";

export type EditingNote = { categoria: Categoria; notaId: string | null } | null;

const CAT_TAG_CLASS: Record<Categoria, string> = {
  meso: "bg-meso text-gold",
  nutricion: "bg-nutri text-gold",
  seguimiento: "bg-seguimiento text-gold",
  otros: "bg-panel-3 text-text-2",
};

// Puente Cerebro ⇄ Clientes: copia el texto de la nota a una tarea nueva en
// personal.tasks (front:'coaching'). Estado local solo para el check visual
// transitorio — no hay vínculo vivo entre la nota y la tarea creada.
function CrearTareaButton({ onCrear }: { onCrear: () => Promise<void> }) {
  const [estado, setEstado] = useState<"idle" | "pending" | "hecho">("idle");

  async function handleClick() {
    setEstado("pending");
    await onCrear();
    setEstado("hecho");
    setTimeout(() => setEstado("idle"), 2000);
  }

  return (
    <button
      type="button"
      disabled={estado === "pending"}
      onClick={handleClick}
      title="Crear tarea a partir de esta nota"
      className={`shrink-0 rounded-md px-1.5 py-0.5 text-[11px] font-medium transition disabled:opacity-50 ${
        estado === "hecho" ? "text-ok" : "text-text-dim hover:bg-[rgba(201,169,110,.12)] hover:text-gold-bright"
      }`}
    >
      {estado === "hecho" ? "✓ Creada" : "→ Tarea"}
    </button>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-panel-2 px-3.5 py-3">
      <div className="text-[10.5px] tracking-wide text-text-dim uppercase">{label}</div>
      <div className="mt-1 text-[15px] font-semibold">{value}</div>
    </div>
  );
}

function Block({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-gold-dim uppercase">
        {title}
        <span className="h-px flex-1 bg-line-soft" />
      </div>
      <div className="grid grid-cols-2 gap-2.5">{children}</div>
      {action}
    </div>
  );
}

function NoteEditForm({
  initialText,
  onSave,
  onCancel,
  onDelete,
}: {
  initialText: string;
  onSave: (texto: string) => void;
  onCancel: () => void;
  onDelete?: () => void;
}) {
  const [text, setText] = useState(initialText);
  return (
    <div className="mb-1.5 rounded-lg border border-gold-dim bg-panel-2 p-3">
      <textarea
        autoFocus
        rows={2}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Escribe la nota…"
        className="w-full resize-y rounded-lg border border-line p-2.5 text-[13px] leading-relaxed outline-none focus:border-gold-dim"
      />
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => text.trim() && onSave(text.trim())}
          className="rounded-md bg-gold px-3 py-1.5 text-xs font-semibold text-[#1a1208] hover:bg-gold-bright"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="rounded-md bg-panel-3 px-3 py-1.5 text-xs font-semibold text-text-2 hover:text-foreground">
          Cancelar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="ml-auto rounded-md bg-bad-bg px-3 py-1.5 text-xs font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

function NotasBlock({
  cliente,
  editingNote,
  onStartAddNote,
  onStartEditNote,
  onCancelEditNote,
  onSaveNote,
  onDeleteNote,
  onCrearTareaDesdeNota,
}: {
  cliente: ClienteVM;
  editingNote: EditingNote;
  onStartAddNote: (categoria: Categoria) => void;
  onStartEditNote: (categoria: Categoria, notaId: string) => void;
  onCancelEditNote: () => void;
  onSaveNote: (categoria: Categoria, notaId: string | null, texto: string) => void;
  onDeleteNote: (notaId: string) => void;
  onCrearTareaDesdeNota: (texto: string) => Promise<void>;
}) {
  return (
    <div className="mb-6">
      <div className="mb-2.5 flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-gold-dim uppercase">
        Notas
        <span className="h-px flex-1 bg-line-soft" />
      </div>
      {CATEGORIAS.map((cat) => {
        const items = cliente.notas[cat];
        const adding = editingNote?.categoria === cat && editingNote.notaId === null;
        return (
          <div key={cat} className="mb-4 last:mb-0">
            <span className={`mb-2 inline-block rounded px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase ${CAT_TAG_CLASS[cat]}`}>
              {CATEGORIA_LABEL[cat]}
            </span>
            {items.map((nota) =>
              editingNote?.categoria === cat && editingNote.notaId === nota.id ? (
                <NoteEditForm
                  key={nota.id}
                  initialText={nota.texto}
                  onSave={(texto) => onSaveNote(cat, nota.id, texto)}
                  onCancel={onCancelEditNote}
                  onDelete={() => onDeleteNote(nota.id)}
                />
              ) : (
                <div key={nota.id} className="mb-1.5 flex items-start justify-between gap-2 rounded-lg bg-panel-2 px-2.5 py-2">
                  <div className="flex-1 text-[13px] leading-relaxed text-text-2">{nota.texto}</div>
                  <CrearTareaButton onCrear={() => onCrearTareaDesdeNota(nota.texto)} />
                  <button
                    type="button"
                    onClick={() => onStartEditNote(cat, nota.id)}
                    className="shrink-0 rounded-md px-1.5 py-0.5 text-xs text-text-dim hover:bg-[rgba(201,169,110,.12)] hover:text-gold-bright"
                  >
                    ✎
                  </button>
                </div>
              ),
            )}
            {items.length === 0 && !adding && <div className="mb-1.5 text-[12.5px] text-text-dim italic">Sin notas</div>}
            {adding ? (
              <NoteEditForm initialText="" onSave={(texto) => onSaveNote(cat, null, texto)} onCancel={onCancelEditNote} />
            ) : (
              <button type="button" onClick={() => onStartAddNote(cat)} className="py-1 text-xs font-semibold text-gold-dim hover:text-gold-bright">
                + Añadir nota
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ClienteDrawer({
  cliente,
  editingNote,
  onClose,
  onStartAddNote,
  onStartEditNote,
  onCancelEditNote,
  onSaveNote,
  onDeleteNote,
  onCrearTareaDesdeNota,
  onMarcarRevision,
  onMarcarCobro,
  onAbrirMeso,
  onAbrirBaja,
  onAbrirReactivar,
  onAbrirEliminar,
}: {
  cliente: ClienteVM;
  editingNote: EditingNote;
  onClose: () => void;
  onStartAddNote: (categoria: Categoria) => void;
  onStartEditNote: (categoria: Categoria, notaId: string) => void;
  onCancelEditNote: () => void;
  onSaveNote: (categoria: Categoria, notaId: string | null, texto: string) => void;
  onDeleteNote: (notaId: string) => void;
  onCrearTareaDesdeNota: (texto: string) => Promise<void>;
  onMarcarRevision: () => void;
  onMarcarCobro: () => void;
  onAbrirMeso: () => void;
  onAbrirBaja: () => void;
  onAbrirReactivar: () => void;
  onAbrirEliminar: () => void;
}) {
  const baja = cliente.estado === "baja";

  return (
    <>
      <div className="sticky top-0 z-10 border-b border-line bg-panel px-7 py-6">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 flex h-8 w-8 items-center justify-center rounded-lg bg-panel-3 text-text-2 hover:bg-panel-2 hover:text-foreground"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-gradient-to-br from-gold to-[#9a7c47] font-heading text-lg font-bold text-[#1a1208]">
          {cliente.iniciales}
        </div>
        <div className="mt-3.5 font-heading text-xl font-bold">{cliente.nombre}</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <span className="rounded-md bg-panel-3 px-2.5 py-1 font-heading text-[11px] font-bold tracking-wide text-gold-bright">
            {cliente.grupoCodigo ?? "—"}
          </span>
          {baja ? <Pill variant="bad">Baja</Pill> : <Pill variant="ok">Activo</Pill>}
          <Pill variant="neutral">{cliente.faseCompletada ? "1ª fase ✓" : "1ª fase pendiente"}</Pill>
        </div>
      </div>

      <div className="px-7 py-6 pb-10">
        {baja && (
          <div className="mb-5 flex gap-2.5 rounded-lg border border-[rgba(217,164,65,.25)] bg-warn-bg px-3.5 py-3 text-[13px] text-[#e8c98a]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="mt-0.5 h-[17px] w-[17px] shrink-0 text-warn">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              De baja desde {cliente.bajaFecha ? fmtDateCorta(cliente.bajaFecha) : "fecha desconocida"}
              {cliente.bajaMotivo ? ` — Motivo: ${cliente.bajaMotivo}` : ""}
            </span>
          </div>
        )}

        <NotasBlock
          cliente={cliente}
          editingNote={editingNote}
          onStartAddNote={onStartAddNote}
          onStartEditNote={onStartEditNote}
          onCancelEditNote={onCancelEditNote}
          onSaveNote={onSaveNote}
          onDeleteNote={onDeleteNote}
          onCrearTareaDesdeNota={onCrearTareaDesdeNota}
        />

        <Block
          title="Mesociclo"
          action={
            !baja && (
              <button
                type="button"
                onClick={onAbrirMeso}
                className="mt-2.5 w-full rounded-lg bg-panel-2 py-2.5 text-center text-[12.5px] font-semibold text-gold-bright hover:bg-[rgba(201,169,110,.14)]"
              >
                Gestionar mesociclo
              </button>
            )
          }
        >
          <Field label="Estructura" value={cliente.mesociclo ? `${cliente.mesociclo.numeroMicrociclos} × ${cliente.mesociclo.diasMicrociclo}d` : "—"} />
          <Field label="Cierra" value={fmtDateCorta(cliente.mesociclo?.fechaFin ?? null)} />
          <Field
            label="Días restantes"
            value={
              cliente.mesociclo?.diasRestantes !== null && cliente.mesociclo?.diasRestantes !== undefined
                ? `${cliente.mesociclo.diasRestantes < 0 ? "–" + Math.abs(cliente.mesociclo.diasRestantes) : cliente.mesociclo.diasRestantes} d`
                : "—"
            }
          />
          <Field label="Estado" value={<MesoPill estado={cliente.mesociclo?.estado ?? null} />} />
        </Block>

        <Block
          title="Revisión"
          action={
            !baja && (
              <button
                type="button"
                onClick={onMarcarRevision}
                className="mt-2.5 w-full rounded-lg bg-panel-2 py-2.5 text-center text-[12.5px] font-semibold text-gold-bright hover:bg-[rgba(201,169,110,.14)]"
              >
                Marcar revisión hecha
              </button>
            )
          }
        >
          <Field label="Grupo" value={`${cliente.grupoNombre ?? "—"} (${cliente.grupoCodigo ?? "—"})`} />
          <Field label="Próxima" value={fmtDateCorta(cliente.proximaRevision)} />
          <Field label="Estado" value={<RevisionPill dias={cliente.revD} />} />
          <Field label="Permanencia" value={`${cliente.permanencia} meses`} />
        </Block>

        <Block
          title="Pago"
          action={
            !baja && (
              <button
                type="button"
                onClick={onMarcarCobro}
                className="mt-2.5 w-full rounded-lg bg-panel-2 py-2.5 text-center text-[12.5px] font-semibold text-gold-bright hover:bg-[rgba(201,169,110,.14)]"
              >
                Marcar cobro cobrado
              </button>
            )
          }
        >
          <Field label="Cuota" value={cliente.cuota !== null ? `${cliente.cuota} €` : "—"} />
          <Field label="Recurrencia" value={cliente.recurrencia ?? "—"} />
          <Field label="Próximo cobro" value={fmtDateCorta(cliente.proximoPago)} />
          <Field label="Estado" value={<PagoPill dias={cliente.pagoD} />} />
        </Block>

        <div className="mb-6">
          <div className="mb-2.5 flex items-center gap-2.5 text-[10px] tracking-[0.2em] text-gold-dim uppercase">
            Valor
            <span className="h-px flex-1 bg-line-soft" />
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="Alta" value={fmtDateCorta(cliente.fechaAlta)} />
            <Field label="LTV acumulado" value={`${cliente.ltvAcumulado} €`} />
          </div>
        </div>

        {baja ? (
          <div className="flex flex-col gap-2">
            <button type="button" onClick={onAbrirReactivar} className="w-full rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright">
              Reactivar cliente
            </button>
            <button type="button" onClick={onAbrirEliminar} className="w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
              Eliminar definitivamente
            </button>
          </div>
        ) : (
          <button type="button" onClick={onAbrirBaja} className="w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Dar de baja
          </button>
        )}
      </div>
    </>
  );
}
