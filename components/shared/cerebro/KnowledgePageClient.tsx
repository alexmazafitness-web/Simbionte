"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { KnCategoryVM, KnNoteVM, FuenteTipo, SesionPausadaVM } from "@/lib/personal/knowledge";
import { FUENTE_LABELS } from "@/lib/personal/knowledge";
import {
  crearCategoria,
  renombrarCategoria,
  eliminarCategoria,
  editarNotaIA,
  eliminarNota,
} from "@/lib/personal/knowledge-actions";
import { Modal } from "@/components/ui/Modal";
import { NuevaNotaModal } from "./knowledge/NuevaNotaModal";
import { KnowledgeChatPanel } from "./knowledge/KnowledgeChatPanel";
import { SesionModo } from "./knowledge/SesionModo";

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-ES", {
    day: "2-digit", month: "short", year: "2-digit",
  });
}

// ── CatRow ────────────────────────────────────────────────────────────────────

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

// ── NotaCard ──────────────────────────────────────────────────────────────────

function NotaCard({ nota, catLabel, onClick }: { nota: KnNoteVM; catLabel: string | null; onClick: () => void }) {
  const fuenteLabel = nota.fuenteTipo ? FUENTE_LABELS[nota.fuenteTipo] : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="flex cursor-pointer flex-col rounded-xl border border-line-soft bg-panel p-4 text-left transition hover:border-gold-dim hover:bg-panel-2"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        {fuenteLabel ? (
          <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.18em] text-gold-dim uppercase">{fuenteLabel}</span>
        ) : <span />}
        <div className="flex items-center gap-1.5">
          {nota.url && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); window.open(nota.url!, "_blank", "noopener,noreferrer"); }}
              className="rounded p-0.5 text-text-dim hover:text-gold-dim"
              title="Abrir enlace"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </button>
          )}
          <span className="text-[10.5px] text-text-dim">{fmtDate(nota.createdAt)}</span>
        </div>
      </div>
      <h3 className="mb-1 font-heading text-[15px] font-bold leading-snug">{nota.title}</h3>
      {nota.fuenteNombre && <p className="mb-2.5 text-[11.5px] text-text-dim">{nota.fuenteNombre}</p>}
      {nota.puntosClave.length > 0 && (
        <ul className="mb-3 space-y-1">
          {nota.puntosClave.slice(0, 3).map((p, i) => (
            <li key={i} className="flex gap-1.5 text-[12px] text-text-2">
              <span className="mt-0.5 shrink-0 text-gold-dim">•</span>
              <span className="line-clamp-2">{p}</span>
            </li>
          ))}
          {nota.puntosClave.length > 3 && <li className="text-[11px] text-text-dim">+{nota.puntosClave.length - 3} más</li>}
        </ul>
      )}
      {catLabel && (
        <div className="mt-auto pt-2">
          <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[10.5px] text-text-dim">{catLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── NotaDetalleModal ──────────────────────────────────────────────────────────

function NotaDetalleModal({
  nota, categorias, open, onClose, onSave, onDelete,
}: {
  nota: KnNoteVM; categorias: KnCategoryVM[]; open: boolean; onClose: () => void;
  onSave: (p: { title: string; contentProcesado: string; puntosClave: string[]; categoryId: string | null }) => void;
  onDelete: () => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [title,      setTitle]      = useState(nota.title);
  const [content,    setContent]    = useState(nota.text ?? "");
  const [puntosText, setPuntosText] = useState(nota.puntosClave.join("\n"));
  const [categoryId, setCategoryId] = useState(nota.categoryId);

  useEffect(() => {
    setTitle(nota.title); setContent(nota.text ?? "");
    setPuntosText(nota.puntosClave.join("\n")); setCategoryId(nota.categoryId); setEditing(false);
  }, [nota.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const fuenteLabel = nota.fuenteTipo ? FUENTE_LABELS[nota.fuenteTipo as FuenteTipo] : null;
  const cat = categorias.find((c) => c.id === nota.categoryId);

  return (
    <Modal open={open} onClose={() => { setEditing(false); onClose(); }} title={editing ? "Editar nota" : nota.title} widthClassName="w-[660px]">
      {!editing ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {fuenteLabel && <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.18em] text-gold-dim uppercase">{fuenteLabel}</span>}
            {nota.fuenteNombre && <span className="text-[12.5px] text-text-2">{nota.fuenteNombre}</span>}
            {cat && <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[11px] text-text-dim">{cat.emoji} {cat.name}</span>}
            <span className="ml-auto text-[11.5px] text-text-dim">{fmtDate(nota.createdAt)}</span>
          </div>
          {nota.puntosClave.length > 0 && (
            <div className="rounded-lg border border-line-soft bg-panel-2 p-3.5">
              <div className="mb-2 text-[10px] font-semibold tracking-[0.18em] text-text-dim uppercase">Puntos clave</div>
              <ul className="space-y-1.5">
                {nota.puntosClave.map((p, i) => (
                  <li key={i} className="flex gap-2 text-[13px]">
                    <span className="mt-0.5 shrink-0 text-gold-dim">•</span><span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {nota.text && <div className="text-[13.5px] leading-relaxed text-text-2 whitespace-pre-wrap">{nota.text}</div>}
          <div className="flex items-center justify-between border-t border-line-soft pt-3">
            <button type="button" onClick={onDelete} className="text-[12px] text-red-400/70 hover:text-red-400">Eliminar nota</button>
            <button type="button" onClick={() => setEditing(true)} className="rounded-lg border border-line px-4 py-1.5 text-[12.5px] text-text-2 hover:border-gold-dim hover:text-foreground">Editar</button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[14px] font-semibold outline-none focus:border-gold-dim" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">Contenido</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={6} className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] leading-relaxed outline-none focus:border-gold-dim" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              Puntos clave <span className="normal-case font-normal tracking-normal text-text-dim">— un punto por línea</span>
            </label>
            <textarea value={puntosText} onChange={(e) => setPuntosText(e.target.value)} rows={3} className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] outline-none focus:border-gold-dim" />
          </div>
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">Categoría</label>
            <select value={categoryId ?? ""} onChange={(e) => setCategoryId(e.target.value || null)} className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim">
              <option value="">Sin categoría</option>
              {categorias.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>)}
            </select>
          </div>
          <div className="flex justify-between pt-1">
            <button type="button" onClick={() => setEditing(false)} className="text-[12.5px] text-text-dim hover:text-foreground">Cancelar</button>
            <button
              type="button" disabled={!title.trim()}
              onClick={() => onSave({ title, contentProcesado: content, puntosClave: puntosText.split("\n").map((l) => l.trim()).filter(Boolean), categoryId })}
              className="rounded-lg bg-gold px-5 py-2 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            >
              Guardar cambios
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type ModalState = null | { type: "nueva" } | { type: "detalle"; id: string } | { type: "addCat" };

export function KnowledgePageClient({
  categorias,
  notas,
  sesionesPausadas,
  notaPrefillId,
}: {
  categorias: KnCategoryVM[];
  notas: KnNoteVM[];
  sesionesPausadas: SesionPausadaVM[];
  notaPrefillId?: string;
}) {
  const [selectedCat,   setSelectedCat]   = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [chatOpen,      setChatOpen]      = useState(false);
  const [sesionActiva,  setSesionActiva]  = useState(false);
  const [resumeSesion,  setResumeSesion]  = useState<SesionPausadaVM | null>(null);
  const [modal,         setModal]         = useState<ModalState>(() =>
    notaPrefillId && notas.some((n) => n.id === notaPrefillId) ? { type: "detalle", id: notaPrefillId } : null,
  );
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editDraft,    setEditDraft]    = useState({ emoji: "", name: "" });
  const [addEmoji,     setAddEmoji]     = useState("📌");
  const [addName,      setAddName]      = useState("");
  const [, startTransition] = useTransition();
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (editingCatId) editInputRef.current?.focus(); }, [editingCatId]);

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => { await action(); onDone?.(); });
  }

  function saveEditCat(id: string) {
    if (!editDraft.name.trim()) { setEditingCatId(null); return; }
    run(() => renombrarCategoria(id, editDraft.emoji, editDraft.name.trim()));
    setEditingCatId(null);
  }

  const q = search.toLowerCase();
  const filteredNotas = notas.filter((n) => {
    if (selectedCat !== null && n.categoryId !== selectedCat) return false;
    if (q && !n.title.toLowerCase().includes(q) && !(n.text ?? "").toLowerCase().includes(q) && !(n.fuenteNombre ?? "").toLowerCase().includes(q)) return false;
    return true;
  });

  const catCount = (id: string | null) =>
    id === null ? notas.length : notas.filter((n) => n.categoryId === id).length;

  const notaDetalle = modal?.type === "detalle" ? (notas.find((n) => n.id === modal.id) ?? null) : null;
  const selectedCatObj = selectedCat ? categorias.find((c) => c.id === selectedCat) : null;
  const headerTitle = selectedCatObj ? `${selectedCatObj.emoji ?? ""} ${selectedCatObj.name}`.trim() : "Todas las notas";

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: categories — oculto en modo sesión ──────────── */}
      {!sesionActiva && <aside className="flex w-56 shrink-0 flex-col border-r border-line-soft">
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
                  value={editDraft.name}
                  onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") saveEditCat(cat.id); if (e.key === "Escape") setEditingCatId(null); }}
                  onBlur={() => saveEditCat(cat.id)}
                  className="flex-1 border-b border-gold bg-transparent text-[13px] outline-none"
                />
              </div>
            ) : (
              <CatRow
                key={cat.id}
                label={`${cat.emoji ?? ""} ${cat.name}`.trim()}
                count={catCount(cat.id)}
                active={selectedCat === cat.id}
                onClick={() => setSelectedCat(cat.id)}
                onEdit={() => { setEditingCatId(cat.id); setEditDraft({ emoji: cat.emoji ?? "", name: cat.name }); }}
                onDelete={() => run(() => eliminarCategoria(cat.id), () => { if (selectedCat === cat.id) setSelectedCat(null); })}
              />
            ),
          )}
        </nav>
      </aside>}

      {/* ── Center: notes / sesión ────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {sesionActiva ? (
          <SesionModo
            categorias={categorias}
            defaultCategoriaId={selectedCat}
            resumeFrom={resumeSesion}
            onGuardada={() => { setSesionActiva(false); setResumeSesion(null); }}
            onCerrar={() => { setSesionActiva(false); setResumeSesion(null); }}
          />
        ) : (<>
        {sesionesPausadas.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-line-soft bg-[#161310] px-6 py-3">
            {sesionesPausadas.map((s) => (
              <button
                key={s.sesionId}
                type="button"
                onClick={() => { setResumeSesion(s); setSesionActiva(true); }}
                className="flex items-center gap-2 rounded-lg border border-gold/25 bg-gold/[0.06] px-3 py-1.5 text-left transition hover:border-gold-dim hover:bg-gold/[0.1]"
              >
                <span className="text-[12px]">⏸</span>
                <span className="text-[12px] text-foreground">
                  {s.fuenteNombre || (s.fuenteTipo ? FUENTE_LABELS[s.fuenteTipo] : "Sesión sin título")}
                </span>
                <span className="text-[10.5px] text-text-dim">· {s.notas.length} nota{s.notas.length !== 1 ? "s" : ""}</span>
                <span className="ml-1 text-[11px] font-semibold text-gold-dim">Continuar sesión →</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-3 border-b border-line-soft px-6 py-3.5">
          <h2 className="font-heading text-[16px] font-bold">{headerTitle}</h2>
          <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[11px] text-text-dim">{filteredNotas.length}</span>
          <div className="ml-auto flex items-center gap-2.5">
            <div className="relative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-dim">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar notas…" className="w-48 rounded-lg border border-line bg-panel-2 py-1.5 pl-7 pr-3 text-[12.5px] outline-none focus:border-gold-dim placeholder:text-text-dim" />
            </div>
            <button
              type="button"
              onClick={() => { setResumeSesion(null); setSesionActiva(true); }}
              className="flex items-center gap-1.5 rounded-lg border border-line px-3.5 py-1.5 text-[12px] font-semibold text-text-2 transition hover:border-gold-dim hover:text-foreground"
            >
              🎙 Sesión
            </button>
            <button type="button" onClick={() => setModal({ type: "nueva" })} className="rounded-lg bg-gold px-3.5 py-1.5 text-[12px] font-bold text-[#1a1208] transition hover:bg-gold-bright">
              + Nueva nota
            </button>
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className={`flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 text-[12px] font-semibold transition ${chatOpen ? "border-gold/40 bg-gold/10 text-gold" : "border-line text-text-2 hover:border-gold-dim hover:text-foreground"}`}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
              Consultar
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {filteredNotas.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center gap-3">
              <p className="text-[13px] text-text-dim">{search ? "Sin notas que coincidan" : "Sin notas en esta categoría"}</p>
              {!search && <button type="button" onClick={() => setModal({ type: "nueva" })} className="text-[12.5px] text-gold-dim hover:text-gold">+ Añadir primera nota</button>}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {filteredNotas.map((n) => {
                const cat = categorias.find((c) => c.id === n.categoryId);
                return (
                  <NotaCard
                    key={n.id}
                    nota={n}
                    catLabel={cat ? `${cat.emoji ?? ""} ${cat.name}`.trim() : null}
                    onClick={() => setModal({ type: "detalle", id: n.id })}
                  />
                );
              })}
            </div>
          )}
        </div>
        </>)}
      </div>

      {/* ── Right: chat — oculto en modo sesión ───────────────── */}
      {!sesionActiva && chatOpen && <KnowledgeChatPanel onClose={() => setChatOpen(false)} />}

      {/* ── Modals ────────────────────────────────────────────── */}
      <NuevaNotaModal
        open={modal?.type === "nueva"}
        onClose={() => setModal(null)}
        categorias={categorias}
        defaultCategoriaId={selectedCat}
        onSaved={() => setModal(null)}
      />

      {notaDetalle && (
        <NotaDetalleModal
          nota={notaDetalle}
          categorias={categorias}
          open={modal?.type === "detalle"}
          onClose={() => setModal(null)}
          onSave={(params) => run(() => editarNotaIA(notaDetalle.id, params), () => setModal(null))}
          onDelete={() => run(() => eliminarNota(notaDetalle.id), () => setModal(null))}
        />
      )}

      <Modal open={modal?.type === "addCat"} onClose={() => setModal(null)} title="Nueva categoría">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={addEmoji} onChange={(e) => setAddEmoji(e.target.value)} placeholder="📌" maxLength={2} className="w-12 rounded-lg border border-line bg-panel-2 p-2 text-center text-xl outline-none focus:border-gold-dim" />
            <input
              autoFocus
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && addName.trim())
                  run(() => crearCategoria(addEmoji, addName.trim()), () => { setModal(null); setAddName(""); setAddEmoji("📌"); });
              }}
              placeholder="Nombre de la categoría"
              className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13.5px] outline-none focus:border-gold-dim placeholder:text-text-dim"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setModal(null)} className="rounded-lg px-4 py-2 text-[12.5px] text-text-dim hover:text-foreground">Cancelar</button>
            <button
              type="button" disabled={!addName.trim()}
              onClick={() => run(() => crearCategoria(addEmoji, addName.trim()), () => { setModal(null); setAddName(""); setAddEmoji("📌"); })}
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
