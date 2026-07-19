"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { fmtEUR } from "@/lib/personal/finanzas";
import {
  PRIORIDAD_LIST, PRIORIDAD_LABEL, PRIORIDAD_COLOR,
  type DeseoVM, type DeseoCategoriaVM, type DeseoPrioridad, type DeseoEstado,
} from "@/lib/personal/deseos";
import {
  crearDeseoCategoria, renombrarDeseoCategoria, eliminarDeseoCategoria,
  crearDeseo, editarDeseo, cambiarEstadoDeseo, eliminarDeseo,
  type DeseoInput,
} from "@/lib/personal/deseos-actions";
import { DeseoModal } from "./DeseoModal";
import { ConfirmarCompraModal } from "./ConfirmarCompraModal";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "2-digit" });
}

function ahorroInfo(deseo: DeseoVM): { texto: string; cls: string } | null {
  if (deseo.estado !== "comprado" || deseo.precioFinal == null || deseo.precio == null) return null;
  const diff = deseo.precio - deseo.precioFinal;
  if (diff > 0) return { texto: `Ahorraste ${fmtEUR(diff, 2)}`, cls: "text-ok" };
  if (diff < 0) return { texto: `+${fmtEUR(Math.abs(diff), 2)} sobre lo previsto`, cls: "text-bad" };
  return { texto: "Pagaste el precio previsto", cls: "text-text-dim" };
}

// ── CatRow (mismo patrón visual que Knowledge) ───────────────────────────────

function CatRow({
  label, count, active, onClick, onEdit, onDelete,
}: {
  label: string; count: number; active: boolean; onClick: () => void;
  onEdit?: () => void; onDelete?: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={`group flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-[13px] transition ${
        active ? "bg-gold/12 text-gold-bright" : "text-text-2 hover:bg-panel-2 hover:text-foreground"
      }`}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className="flex-1 truncate">{label}</span>
      {hovered && onEdit ? (
        <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={onEdit} className="rounded p-0.5 text-text-dim hover:text-foreground" title="Renombrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          {onDelete && (
            <button type="button" onClick={onDelete} className="rounded p-0.5 text-text-dim hover:text-red-400" title="Eliminar">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3 w-3">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                <path d="M10 11v6M14 11v6M9 6V4h6v2" />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${active ? "bg-gold/20 text-gold-dim" : "bg-panel-3 text-text-dim"}`}>
          {count}
        </span>
      )}
    </div>
  );
}

// ── DeseoCard ─────────────────────────────────────────────────────────────────

function DeseoCard({
  deseo, catLabel, onEdit, onToggleEstado, onDelete,
}: {
  deseo: DeseoVM; catLabel: string | null;
  onEdit: () => void; onToggleEstado: () => void; onDelete: () => void;
}) {
  const [confirmDel, setConfirmDel] = useState(false);
  const color = PRIORIDAD_COLOR[deseo.prioridad];
  const comprado = deseo.estado === "comprado";
  const ahorro = ahorroInfo(deseo);

  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    onDelete();
  }

  return (
    <div
      className={`group flex flex-col rounded-xl border border-line-soft bg-panel p-4 transition ${comprado ? "opacity-50" : ""}`}
      style={{ borderLeft: `4px solid ${color}` }}
    >
      {deseo.imagenUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={deseo.imagenUrl} alt="" className="mb-2.5 h-32 w-full rounded-lg object-cover" />
      )}
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className={`flex-1 text-[13.5px] font-bold leading-snug ${comprado ? "line-through" : ""}`}>{deseo.nombre}</h3>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {deseo.link && (
            <a
              href={deseo.link}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-text-dim hover:text-gold-dim"
              title="Abrir enlace"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </a>
          )}
          <button type="button" onClick={onEdit} className="rounded p-1 text-text-dim hover:text-foreground" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            onBlur={() => setConfirmDel(false)}
            className={`rounded p-1 ${confirmDel ? "text-red-400" : "text-text-dim hover:text-red-400"}`}
            title={confirmDel ? "¿Seguro? Pulsa de nuevo" : "Eliminar"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {comprado && deseo.precioFinal != null ? (
        <div className="mb-1 flex flex-wrap items-center gap-1.5">
          <span className="text-[13px] font-semibold text-gold-dim">{fmtEUR(deseo.precioFinal, 2)}</span>
          {deseo.precio != null && deseo.precio !== deseo.precioFinal && (
            <span className="text-[11px] text-text-dim line-through">{fmtEUR(deseo.precio, 2)}</span>
          )}
        </div>
      ) : (
        deseo.precio != null && <p className="mb-1.5 text-[13px] font-semibold text-gold-dim">{fmtEUR(deseo.precio, 2)}</p>
      )}
      {ahorro && <p className={`mb-1.5 text-[11.5px] font-semibold ${ahorro.cls}`}>{ahorro.texto}</p>}
      {deseo.notas && <p className="mb-2.5 text-[12px] text-text-2">{deseo.notas}</p>}

      <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
        <span
          className="rounded-md px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.14em] uppercase"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {PRIORIDAD_LABEL[deseo.prioridad]}
        </span>
        {catLabel && <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[10.5px] text-text-dim">{catLabel}</span>}
        <span className="text-[10.5px] text-text-dim">{fmtDate(deseo.createdAt)}</span>
        <button
          type="button"
          onClick={onToggleEstado}
          className="ml-auto rounded-md bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-text-dim transition hover:text-foreground"
        >
          {comprado ? "Marcar pendiente" : "Marcar comprado"}
        </button>
      </div>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type ModalState = null | { type: "nueva" } | { type: "detalle"; id: string } | { type: "addCat" };

export function DeseosPageClient({
  categorias, deseos,
}: {
  categorias: DeseoCategoriaVM[];
  deseos: DeseoVM[];
}) {
  const [selectedCat, setSelectedCat]         = useState<string | null>(null);
  const [filtroPrioridad, setFiltroPrioridad] = useState<DeseoPrioridad | "todas">("todas");
  const [filtroEstado, setFiltroEstado]       = useState<DeseoEstado | "todos">("todos");
  const [modal, setModal]                     = useState<ModalState>(null);
  const [confirmandoCompraId, setConfirmandoCompraId] = useState<string | null>(null);
  const [editingCatId, setEditingCatId]       = useState<string | null>(null);
  const [editDraft, setEditDraft]             = useState({ emoji: "", nombre: "" });
  const [addEmoji, setAddEmoji]               = useState("📌");
  const [addNombre, setAddNombre]             = useState("");
  const [pending, startTransition]            = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingCatId) editInputRef.current?.focus(); }, [editingCatId]);

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => { await action(); onDone?.(); });
  }

  function saveEditCat(id: string) {
    if (!editDraft.nombre.trim()) { setEditingCatId(null); return; }
    run(() => renombrarDeseoCategoria(id, editDraft.emoji, editDraft.nombre.trim()));
    setEditingCatId(null);
  }

  const filteredDeseos = deseos
    .filter((d) => selectedCat === null || d.categoriaId === selectedCat)
    .filter((d) => filtroPrioridad === "todas" || d.prioridad === filtroPrioridad)
    .filter((d) => filtroEstado === "todos" || d.estado === filtroEstado)
    .sort((a, b) => (a.estado === b.estado ? 0 : a.estado === "comprado" ? 1 : -1));

  const catCount = (id: string | null) =>
    id === null ? deseos.length : deseos.filter((d) => d.categoriaId === id).length;

  const deseoDetalle = modal?.type === "detalle" ? (deseos.find((d) => d.id === modal.id) ?? null) : null;
  const selectedCatObj = selectedCat ? categorias.find((c) => c.id === selectedCat) : null;
  const headerTitle = selectedCatObj ? `${selectedCatObj.emoji ?? ""} ${selectedCatObj.nombre}`.trim() : "Todos los deseos";

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: categorías ──────────────────────────────────── */}
      <aside className="flex w-56 shrink-0 flex-col border-r border-line-soft">
        <div className="flex items-center justify-between border-b border-line-soft px-4 py-3.5">
          <span className="text-[10px] font-bold tracking-[0.22em] text-gold-dim uppercase">Categorías</span>
          <button type="button" onClick={() => setModal({ type: "addCat" })} className="flex h-5 w-5 items-center justify-center rounded text-text-dim hover:bg-panel-2 hover:text-foreground" title="Nueva categoría">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5"><path d="M12 5v14M5 12h14" /></svg>
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto p-2">
          <CatRow label="Todas" count={catCount(null)} active={selectedCat === null} onClick={() => setSelectedCat(null)} />
          {categorias.map((cat) =>
            editingCatId === cat.id ? (
              <div key={cat.id} className="flex items-center gap-1 rounded-lg px-2 py-1.5">
                <input value={editDraft.emoji} onChange={(e) => setEditDraft((d) => ({ ...d, emoji: e.target.value }))} className="w-8 bg-transparent text-center text-[14px] outline-none" maxLength={2} />
                <input
                  ref={editInputRef}
                  value={editDraft.nombre}
                  onChange={(e) => setEditDraft((d) => ({ ...d, nombre: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEditCat(cat.id); if (e.key === "Escape") setEditingCatId(null); }}
                  onBlur={() => saveEditCat(cat.id)}
                  className="flex-1 border-b border-gold bg-transparent text-[13px] outline-none"
                />
              </div>
            ) : (
              <CatRow
                key={cat.id}
                label={`${cat.emoji ?? ""} ${cat.nombre}`.trim()}
                count={catCount(cat.id)}
                active={selectedCat === cat.id}
                onClick={() => setSelectedCat(cat.id)}
                onEdit={() => { setEditingCatId(cat.id); setEditDraft({ emoji: cat.emoji ?? "", nombre: cat.nombre }); }}
                onDelete={() => run(() => eliminarDeseoCategoria(cat.id), () => { if (selectedCat === cat.id) setSelectedCat(null); })}
              />
            ),
          )}
        </nav>
      </aside>

      {/* ── Center: deseos ────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center gap-3 border-b border-line-soft px-6 py-3.5">
          <h2 className="font-heading text-[16px] font-bold">{headerTitle}</h2>
          <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[11px] text-text-dim">{filteredDeseos.length}</span>
          <div className="ml-auto flex items-center gap-2.5">
            <select
              value={filtroPrioridad}
              onChange={(e) => setFiltroPrioridad(e.target.value as DeseoPrioridad | "todas")}
              className="rounded-lg border border-line bg-panel-2 py-1.5 pl-2.5 pr-3 text-[12.5px] outline-none focus:border-gold-dim"
            >
              <option value="todas">Toda prioridad</option>
              {PRIORIDAD_LIST.map((p) => <option key={p} value={p}>{PRIORIDAD_LABEL[p]}</option>)}
            </select>
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value as DeseoEstado | "todos")}
              className="rounded-lg border border-line bg-panel-2 py-1.5 pl-2.5 pr-3 text-[12.5px] outline-none focus:border-gold-dim"
            >
              <option value="todos">Todo estado</option>
              <option value="pendiente">Pendiente</option>
              <option value="comprado">Comprado</option>
            </select>
            <button type="button" onClick={() => setModal({ type: "nueva" })} className="rounded-lg bg-gold px-3.5 py-1.5 text-[12px] font-bold text-[#1a1208] transition hover:bg-gold-bright">
              + Añadir deseo
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {filteredDeseos.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
              <p className="text-[13px] text-text-dim">Sin deseos que coincidan</p>
              <button type="button" onClick={() => setModal({ type: "nueva" })} className="text-[12.5px] text-gold-dim hover:text-gold">+ Añadir primer deseo</button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredDeseos.map((d) => {
                const cat = categorias.find((c) => c.id === d.categoriaId);
                return (
                  <DeseoCard
                    key={d.id}
                    deseo={d}
                    catLabel={cat ? `${cat.emoji ?? ""} ${cat.nombre}`.trim() : null}
                    onEdit={() => setModal({ type: "detalle", id: d.id })}
                    onToggleEstado={() =>
                      d.estado === "comprado"
                        ? run(() => cambiarEstadoDeseo(d.id, "pendiente"))
                        : setConfirmandoCompraId(d.id)
                    }
                    onDelete={() => run(() => eliminarDeseo(d.id))}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}
      <DeseoModal
        key={modal?.type === "detalle" ? modal.id : modal?.type === "nueva" ? "nueva" : "closed"}
        open={modal?.type === "nueva" || modal?.type === "detalle"}
        onClose={() => setModal(null)}
        item={deseoDetalle}
        categorias={categorias}
        categoriaPorDefecto={selectedCat}
        pending={pending}
        onSubmit={(input: DeseoInput) =>
          run(() => (deseoDetalle ? editarDeseo(deseoDetalle.id, input) : crearDeseo(input)), () => setModal(null))
        }
        onDelete={deseoDetalle ? () => run(() => eliminarDeseo(deseoDetalle.id), () => setModal(null)) : undefined}
      />

      <ConfirmarCompraModal
        key={confirmandoCompraId ?? "confirmar-closed"}
        open={confirmandoCompraId !== null}
        deseo={confirmandoCompraId ? (deseos.find((d) => d.id === confirmandoCompraId) ?? null) : null}
        pending={pending}
        onClose={() => setConfirmandoCompraId(null)}
        onConfirm={(precioFinal) => {
          if (confirmandoCompraId) run(() => cambiarEstadoDeseo(confirmandoCompraId, "comprado", precioFinal));
        }}
      />

      <Modal open={modal?.type === "addCat"} onClose={() => setModal(null)} title="Nueva categoría">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={addEmoji} onChange={(e) => setAddEmoji(e.target.value)} placeholder="📌" maxLength={2} className="w-12 rounded-lg border border-line bg-panel-2 p-2 text-center text-xl outline-none focus:border-gold-dim" />
            <input
              autoFocus
              value={addNombre}
              onChange={(e) => setAddNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && addNombre.trim())
                  run(() => crearDeseoCategoria(addEmoji, addNombre.trim()), () => { setModal(null); setAddNombre(""); setAddEmoji("📌"); });
              }}
              placeholder="Nombre de la categoría"
              className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13.5px] outline-none focus:border-gold-dim placeholder:text-text-dim"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-[12.5px] text-text-dim hover:text-foreground">Cancelar</button>
            <button
              type="button" disabled={!addNombre.trim()}
              onClick={() => run(() => crearDeseoCategoria(addEmoji, addNombre.trim()), () => { setModal(null); setAddNombre(""); setAddEmoji("📌"); })}
              className="rounded-lg bg-gold px-4 py-2 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            >
              Crear
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
