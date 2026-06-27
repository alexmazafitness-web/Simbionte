"use client";

import { forwardRef, useEffect, useRef, useState, useTransition } from "react";
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  RUTAS_APP,
  buildSectionVMs,
  type SidebarData,
  type SidebarItem,
  type SidebarSection,
  type SidebarSubsection,
} from "@/lib/personal/sidebar";
import {
  addItem,
  addSection,
  addSubsection,
  eliminarItem,
  eliminarSection,
  eliminarSubsection,
  renombrarItem,
  renombrarSection,
  renombrarSubsection,
  reordenarItems,
  reordenarSections,
  reordenarSubsections,
  toggleItemVisible,
  toggleSectionVisible,
  toggleSubsectionVisible,
} from "@/lib/personal/sidebar-actions";

// ── Types ─────────────────────────────────────────────────────────────────────

type DragMeta =
  | { type: "section" }
  | { type: "section-child"; sectionId: string }
  | { type: "sub-item"; subsectionId: string };

type ConfirmState = {
  type: "section" | "sub" | "item";
  id: string;
  nombre: string;
} | null;

type AddState =
  | { type: "item"; sectionId: string; subsectionId: string | null }
  | { type: "sub"; sectionId: string }
  | { type: "section" }
  | null;

// ── Drag handle icon ──────────────────────────────────────────────────────────

const DragHandle = forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  function DragHandle(props, ref) {
    return (
      <button
        type="button"
        {...props}
        ref={ref}
        className="flex h-5 w-5 cursor-grab touch-none items-center justify-center rounded text-neutral-700 hover:text-neutral-400 active:cursor-grabbing"
        title="Arrastrar para reordenar"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <circle cx="7" cy="5"  r="1.5" /><circle cx="13" cy="5"  r="1.5" />
          <circle cx="7" cy="10" r="1.5" /><circle cx="13" cy="10" r="1.5" />
          <circle cx="7" cy="15" r="1.5" /><circle cx="13" cy="15" r="1.5" />
        </svg>
      </button>
    );
  },
);

// ── Row icons ─────────────────────────────────────────────────────────────────

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5 text-neutral-700">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6M9 6V4h6v2" />
    </svg>
  );
}

// ── Sortable row wrappers ─────────────────────────────────────────────────────

function SortableRow({
  id,
  dragMeta,
  children,
  className,
}: {
  id: string;
  dragMeta: DragMeta;
  children: (handle: React.ReactNode, isDragging: boolean) => React.ReactNode;
  className?: string;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id, data: dragMeta });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handle = (
    <DragHandle ref={setActivatorNodeRef} {...attributes} {...listeners} />
  );

  return (
    <div ref={setNodeRef} style={style} className={className}>
      {children(handle, isDragging)}
    </div>
  );
}

// ── Inline rename input ───────────────────────────────────────────────────────

function RenameInput({
  value,
  onSave,
  onCancel,
}: {
  value: string;
  onSave: (v: string) => void;
  onCancel: () => void;
}) {
  const [v, setV] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => ref.current?.focus(), []);

  return (
    <input
      ref={ref}
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onSave(v.trim() || value);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onSave(v.trim() || value)}
      className="min-w-0 flex-1 rounded bg-panel-3 px-1.5 py-0.5 text-[12.5px] outline-none ring-1 ring-gold-dim"
    />
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────

export function EditSidebarModal({
  open,
  onClose,
  data,
  onDataChange,
}: {
  open: boolean;
  onClose: () => void;
  data: SidebarData;
  onDataChange: (d: SidebarData) => void;
}) {
  const [sections,    setSections]    = useState(data.sections);
  const [subsections, setSubsections] = useState(data.subsections);
  const [items,       setItems]       = useState(data.items);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [confirmDel,  setConfirmDel]  = useState<ConfirmState>(null);
  const [adding,      setAdding]      = useState<AddState>(null);
  const [newNombre,   setNewNombre]   = useState("");
  const [newRuta,     setNewRuta]     = useState("");
  const [newIcono,    setNewIcono]    = useState("");
  const [activeId,    setActiveId]    = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Keep in sync with parent data on reopen
  useEffect(() => {
    if (open) {
      setSections(data.sections);
      setSubsections(data.subsections);
      setItems(data.items);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function apply(
    s: typeof sections,
    sub: typeof subsections,
    it: typeof items,
  ) {
    setSections(s);
    setSubsections(sub);
    setItems(it);
    onDataChange({ sections: s, subsections: sub, items: it });
  }

  // ── Toggle visible ──────────────────────────────────────────────────────────

  function doToggleSection(id: string, current: boolean) {
    apply(sections.map((s) => (s.id === id ? { ...s, visible: !current } : s)), subsections, items);
    void toggleSectionVisible(id, !current);
  }
  function doToggleSub(id: string, current: boolean) {
    apply(sections, subsections.map((s) => (s.id === id ? { ...s, visible: !current } : s)), items);
    void toggleSubsectionVisible(id, !current);
  }
  function doToggleItem(id: string, current: boolean) {
    apply(sections, subsections, items.map((i) => (i.id === id ? { ...i, visible: !current } : i)));
    void toggleItemVisible(id, !current);
  }

  // ── Rename ──────────────────────────────────────────────────────────────────

  function doRenameSection(id: string, nombre: string) {
    apply(sections.map((s) => (s.id === id ? { ...s, nombre } : s)), subsections, items);
    void renombrarSection(id, nombre);
    setEditingId(null);
  }
  function doRenameSub(id: string, nombre: string) {
    apply(sections, subsections.map((s) => (s.id === id ? { ...s, nombre } : s)), items);
    void renombrarSubsection(id, nombre);
    setEditingId(null);
  }
  function doRenameItem(id: string, nombre: string) {
    apply(sections, subsections, items.map((i) => (i.id === id ? { ...i, nombre } : i)));
    void renombrarItem(id, nombre);
    setEditingId(null);
  }

  // ── Delete ──────────────────────────────────────────────────────────────────

  function executeDelete() {
    if (!confirmDel) return;
    if (confirmDel.type === "section") {
      apply(
        sections.filter((s) => s.id !== confirmDel.id),
        subsections.filter((s) => s.sectionId !== confirmDel.id),
        items.filter((i) => i.sectionId !== confirmDel.id),
      );
      void eliminarSection(confirmDel.id);
    } else if (confirmDel.type === "sub") {
      apply(
        sections,
        subsections.filter((s) => s.id !== confirmDel.id),
        items.filter((i) => i.subsectionId !== confirmDel.id),
      );
      void eliminarSubsection(confirmDel.id);
    } else {
      apply(sections, subsections, items.filter((i) => i.id !== confirmDel.id));
      void eliminarItem(confirmDel.id);
    }
    setConfirmDel(null);
  }

  // ── Add ──────────────────────────────────────────────────────────────────────

  function doAdd() {
    if (!adding || !newNombre.trim()) return;
    const nombre = newNombre.trim();

    if (adding.type === "section") {
      startTransition(async () => {
        const id = await addSection(nombre, newIcono.trim() || null);
        const orden = Math.max(0, ...sections.map((s) => s.orden)) + 1;
        apply(
          [...sections, { id, nombre, icono: newIcono.trim() || null, orden, esCore: false, visible: true }],
          subsections,
          items,
        );
      });
    } else if (adding.type === "sub") {
      startTransition(async () => {
        const id = await addSubsection(adding.sectionId, nombre);
        const subsInSection = subsections.filter((s) => s.sectionId === adding.sectionId);
        const orden = Math.max(0, ...subsInSection.map((s) => s.orden)) + 1;
        apply(sections, [...subsections, { id, sectionId: adding.sectionId, nombre, orden, esCore: false, visible: true }], items);
      });
    } else {
      if (!newRuta) return;
      startTransition(async () => {
        const id = await addItem(adding.sectionId, adding.subsectionId, nombre, newRuta, newIcono.trim() || null);
        const contextItems = items.filter(
          (i) => i.sectionId === adding.sectionId && i.subsectionId === adding.subsectionId,
        );
        const orden = Math.max(0, ...contextItems.map((i) => i.orden)) + 1;
        apply(sections, subsections, [
          ...items,
          {
            id,
            sectionId: adding.sectionId,
            subsectionId: adding.subsectionId,
            nombre,
            ruta: newRuta,
            icono: newIcono.trim() || null,
            orden,
            esCore: false,
            visible: true,
          },
        ]);
      });
    }
    setAdding(null);
    setNewNombre("");
    setNewRuta("");
    setNewIcono("");
  }

  // ── Drag ─────────────────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const meta = active.data.current as DragMeta;

    if (meta.type === "section") {
      const oldIdx = sections.findIndex((s) => s.id === active.id);
      const newIdx = sections.findIndex((s) => s.id === over.id);
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(sections, oldIdx, newIdx).map((s, i) => ({ ...s, orden: i + 1 }));
      apply(reordered, subsections, items);
      void reordenarSections(reordered.map((s) => ({ id: s.id, orden: s.orden })));

    } else if (meta.type === "section-child") {
      // This context contains mixed subsection IDs and direct item IDs
      // Determine active type
      const isSub   = subsections.some((s) => s.id === (active.id as string));
      const isItem  = !isSub;
      const isOverSub  = subsections.some((s) => s.id === (over.id as string));
      const isOverItem = !isOverSub;

      // Only reorder within same section — get section children sorted
      const sectionId = meta.sectionId;
      const subs  = subsections.filter((s) => s.sectionId === sectionId);
      const dItems = items.filter((i) => i.sectionId === sectionId && i.subsectionId === null);

      type Child = { id: string; isSub: boolean; orden: number };
      const children: Child[] = [
        ...subs.map((s) => ({ id: s.id, isSub: true, orden: s.orden })),
        ...dItems.map((i) => ({ id: i.id, isSub: false, orden: i.orden })),
      ].sort((a, b) => a.orden - b.orden);

      const oldIdx = children.findIndex((c) => c.id === (active.id as string));
      const newIdx = children.findIndex((c) => c.id === (over.id as string));
      if (oldIdx === -1 || newIdx === -1) return;

      const reordered = arrayMove(children, oldIdx, newIdx).map((c, i) => ({ ...c, orden: i + 1 }));

      const newSubs = subsections.map((s) => {
        const r = reordered.find((c) => c.id === s.id && c.isSub);
        return r ? { ...s, orden: r.orden } : s;
      });
      const newItems = items.map((i) => {
        const r = reordered.find((c) => c.id === i.id && !c.isSub);
        return r ? { ...i, orden: r.orden } : i;
      });

      apply(sections, newSubs, newItems);

      const subsToReorder = reordered.filter((c) => c.isSub).map((c) => ({ id: c.id, orden: c.orden }));
      const itemsToReorder = reordered.filter((c) => !c.isSub).map((c) => ({ id: c.id, orden: c.orden }));
      if (subsToReorder.length) void reordenarSubsections(subsToReorder);
      if (itemsToReorder.length) void reordenarItems(itemsToReorder);

    } else if (meta.type === "sub-item") {
      const subsectionId = meta.subsectionId;
      const subItems = items.filter((i) => i.subsectionId === subsectionId).sort((a, b) => a.orden - b.orden);
      const oldIdx = subItems.findIndex((i) => i.id === (active.id as string));
      const newIdx = subItems.findIndex((i) => i.id === (over.id as string));
      if (oldIdx === -1 || newIdx === -1) return;
      const reordered = arrayMove(subItems, oldIdx, newIdx).map((i, idx) => ({ ...i, orden: idx + 1 }));
      const newItems = items.map((i) => reordered.find((r) => r.id === i.id) ?? i);
      apply(sections, subsections, newItems);
      void reordenarItems(reordered.map((i) => ({ id: i.id, orden: i.orden })));
    }
  }

  // ── Active drag label for overlay ─────────────────────────────────────────

  const activeLabel = activeId
    ? (sections.find((s) => s.id === activeId)?.nombre ??
       subsections.find((s) => s.id === activeId)?.nombre ??
       items.find((i) => i.id === activeId)?.nombre ?? "")
    : "";

  // ── Render helpers ────────────────────────────────────────────────────────

  function rowIcons(
    id: string,
    nombre: string,
    esCore: boolean,
    visible: boolean,
    type: "section" | "sub" | "item",
    onToggle: () => void,
    onEdit: () => void,
  ) {
    return (
      <div className="flex shrink-0 items-center gap-0.5">
        {esCore ? (
          <span className="p-1" title="Elemento fijo — no se puede eliminar"><LockIcon /></span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmDel({ type, id, nombre })}
            className="rounded p-1 text-neutral-700 hover:text-bad"
            title="Eliminar"
          >
            <TrashIcon />
          </button>
        )}
        <button
          type="button"
          onClick={onToggle}
          className={`rounded p-1 transition ${visible ? "text-neutral-500 hover:text-neutral-200" : "text-neutral-800 hover:text-neutral-500"}`}
          title={visible ? "Ocultar" : "Mostrar"}
        >
          <EyeIcon open={visible} />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="rounded p-1 text-neutral-700 hover:text-neutral-300"
          title="Renombrar"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    );
  }

  function renderAddForm() {
    if (!adding) return null;
    return (
      <div className="mx-4 mb-2 rounded-lg border border-gold/30 bg-panel-3 p-3">
        <p className="mb-2 text-[10.5px] font-bold uppercase tracking-widest text-gold-dim">
          {adding.type === "section" ? "Nueva sección" : adding.type === "sub" ? "Nueva subsección" : "Nuevo link"}
        </p>
        <div className="flex flex-col gap-2">
          <input
            autoFocus
            placeholder="Nombre"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doAdd(); if (e.key === "Escape") { setAdding(null); } }}
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim"
          />
          {adding.type === "item" && (
            <select
              value={newRuta}
              onChange={(e) => setNewRuta(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim"
            >
              <option value="">— Selecciona una ruta —</option>
              {RUTAS_APP.map((r) => (
                <option key={r.ruta} value={r.ruta}>{r.grupo} · {r.label}</option>
              ))}
            </select>
          )}
          {(adding.type === "section" || adding.type === "item") && (
            <input
              placeholder="Emoji o icono (opcional)"
              value={newIcono}
              onChange={(e) => setNewIcono(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim"
            />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={doAdd}
              disabled={!newNombre.trim() || (adding.type === "item" && !newRuta)}
              className="rounded-lg bg-gold px-3 py-1 text-[12px] font-bold text-[#1a1208] disabled:opacity-40"
            >
              Añadir
            </button>
            <button
              type="button"
              onClick={() => { setAdding(null); setNewNombre(""); setNewRuta(""); setNewIcono(""); }}
              className="rounded-lg border border-line px-3 py-1 text-[12px] text-text-dim hover:text-foreground"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!open) return null;

  const vms = buildSectionVMs({ sections, subsections, items }, true);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="flex h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-line-soft bg-[#181818] shadow-2xl">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-line-soft px-6 py-4">
          <div>
            <h2 className="font-heading text-[17px] font-bold">Editar sidebar</h2>
            <p className="text-[11px] text-text-dim">Arrastra para reordenar · Ojo para ocultar · Candado = fijo</p>
          </div>
          <button type="button" onClick={onClose} className="text-text-dim hover:text-foreground">✕</button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto py-3">
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            {/* Sections sortable */}
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {vms.map((vm) => {
                const { section, children } = vm;
                const childIds = children.map((c) =>
                  c.kind === "sub" ? c.sub.id : c.item.id,
                );

                return (
                  <SortableRow
                    key={section.id}
                    id={section.id}
                    dragMeta={{ type: "section" }}
                    className="mb-1"
                  >
                    {(handle) => (
                      <div>
                        {/* Section header */}
                        <div className={`mx-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5 ${section.visible ? "" : "opacity-40"}`}>
                          {handle}
                          {editingId === section.id ? (
                            <RenameInput
                              value={section.nombre}
                              onSave={(v) => doRenameSection(section.id, v)}
                              onCancel={() => setEditingId(null)}
                            />
                          ) : (
                            <span className="flex-1 truncate text-[11px] font-bold uppercase tracking-widest text-neutral-400">
                              {section.nombre}
                            </span>
                          )}
                          {rowIcons(
                            section.id, section.nombre, section.esCore, section.visible,
                            "section",
                            () => doToggleSection(section.id, section.visible),
                            () => setEditingId(section.id),
                          )}
                        </div>

                        {/* Section children sortable */}
                        <SortableContext items={childIds} strategy={verticalListSortingStrategy}>
                          {children.map((child) => {
                            if (child.kind === "sub") {
                              const { sub } = child;
                              const subItemIds = child.items.map((i) => i.id);
                              return (
                                <SortableRow
                                  key={sub.id}
                                  id={sub.id}
                                  dragMeta={{ type: "section-child", sectionId: section.id }}
                                >
                                  {(handle) => (
                                    <div>
                                      {/* Subsection header */}
                                      <div className={`mx-2 flex items-center gap-1.5 rounded-lg py-1.5 pl-6 pr-2 ${sub.visible ? "" : "opacity-40"}`}>
                                        {handle}
                                        {editingId === sub.id ? (
                                          <RenameInput
                                            value={sub.nombre}
                                            onSave={(v) => doRenameSub(sub.id, v)}
                                            onCancel={() => setEditingId(null)}
                                          />
                                        ) : (
                                          <span className="flex-1 truncate text-[9.5px] font-bold uppercase tracking-[0.2em] text-neutral-600">
                                            {sub.nombre}
                                          </span>
                                        )}
                                        {rowIcons(
                                          sub.id, sub.nombre, sub.esCore, sub.visible,
                                          "sub",
                                          () => doToggleSub(sub.id, sub.visible),
                                          () => setEditingId(sub.id),
                                        )}
                                      </div>

                                      {/* Subsection items */}
                                      <SortableContext items={subItemIds} strategy={verticalListSortingStrategy}>
                                        {child.items.map((item) => (
                                          <ItemRow
                                            key={item.id}
                                            item={item}
                                            dragMeta={{ type: "sub-item", subsectionId: sub.id }}
                                            isEditing={editingId === item.id}
                                            onToggle={() => doToggleItem(item.id, item.visible)}
                                            onEdit={() => setEditingId(item.id)}
                                            onRename={(v) => doRenameItem(item.id, v)}
                                            onCancelEdit={() => setEditingId(null)}
                                            onDelete={() => setConfirmDel({ type: "item", id: item.id, nombre: item.nombre })}
                                          />
                                        ))}
                                      </SortableContext>

                                      {/* Add item to subsection */}
                                      <button
                                        type="button"
                                        onClick={() => { setAdding({ type: "item", sectionId: section.id, subsectionId: sub.id }); setNewNombre(""); setNewRuta(""); }}
                                        className="mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-1 rounded py-1 pl-16 text-[11px] text-neutral-700 hover:text-neutral-400"
                                      >
                                        <span className="text-[14px] leading-none">+</span> Añadir link
                                      </button>
                                      {adding?.type === "item" && adding.subsectionId === sub.id && renderAddForm()}
                                    </div>
                                  )}
                                </SortableRow>
                              );
                            }

                            // Direct item (kind === "item") — shown at subsection level, use subsection label style
                            const { item } = child;
                            return (
                              <SortableRow
                                key={item.id}
                                id={item.id}
                                dragMeta={{ type: "section-child", sectionId: section.id }}
                              >
                                {(handle) => (
                                  <ItemRow
                                    item={item}
                                    handle={handle}
                                    indent="pl-7"
                                    labelClassName={SUB_LABEL_CLASS}
                                    isEditing={editingId === item.id}
                                    onToggle={() => doToggleItem(item.id, item.visible)}
                                    onEdit={() => setEditingId(item.id)}
                                    onRename={(v) => doRenameItem(item.id, v)}
                                    onCancelEdit={() => setEditingId(null)}
                                    onDelete={() => setConfirmDel({ type: "item", id: item.id, nombre: item.nombre })}
                                  />
                                )}
                              </SortableRow>
                            );
                          })}
                        </SortableContext>

                        {/* Add subsection / add direct item buttons */}
                        <div className="mx-2 mb-2 mt-1 flex gap-3 pl-7">
                          <button
                            type="button"
                            onClick={() => { setAdding({ type: "sub", sectionId: section.id }); setNewNombre(""); }}
                            className="flex items-center gap-1 text-[11px] text-neutral-700 hover:text-neutral-400"
                          >
                            <span className="text-[14px] leading-none">+</span> Añadir subsección
                          </button>
                          <button
                            type="button"
                            onClick={() => { setAdding({ type: "item", sectionId: section.id, subsectionId: null }); setNewNombre(""); setNewRuta(""); }}
                            className="flex items-center gap-1 text-[11px] text-neutral-700 hover:text-neutral-400"
                          >
                            <span className="text-[14px] leading-none">+</span> Añadir link directo
                          </button>
                        </div>
                        {adding?.type === "sub" && adding.sectionId === section.id && renderAddForm()}
                        {adding?.type === "item" && adding.sectionId === section.id && adding.subsectionId === null && renderAddForm()}

                        <div className="mx-4 h-px bg-neutral-800/60" />
                      </div>
                    )}
                  </SortableRow>
                );
              })}
            </SortableContext>

            <DragOverlay>
              {activeId && (
                <div className="rounded-lg border border-gold/30 bg-panel-3 px-4 py-2 text-[12.5px] text-neutral-300 shadow-xl">
                  {activeLabel}
                </div>
              )}
            </DragOverlay>
          </DndContext>

          {/* Add section */}
          <div className="px-4 pt-2">
            <button
              type="button"
              onClick={() => { setAdding({ type: "section" }); setNewNombre(""); }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-neutral-800 py-2 text-[12px] text-neutral-700 hover:border-neutral-600 hover:text-neutral-400"
            >
              <span className="text-[16px] leading-none">+</span> Añadir sección
            </button>
            {adding?.type === "section" && renderAddForm()}
          </div>
        </div>

        {/* Delete confirmation */}
        {confirmDel && (
          <div className="shrink-0 border-t border-line-soft bg-panel px-6 py-4">
            <p className="mb-3 text-[13px] text-foreground">
              ¿Eliminar <span className="font-semibold text-bad">"{confirmDel.nombre}"</span>?
              {confirmDel.type === "section" && " Se eliminarán también todas sus subsecciones e items."}
              {confirmDel.type === "sub" && " Se eliminarán también todos sus links."}
              {" "}Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={executeDelete}
                className="rounded-lg bg-bad px-4 py-1.5 text-[12.5px] font-bold text-white"
              >
                Eliminar
              </button>
              <button
                type="button"
                onClick={() => setConfirmDel(null)}
                className="rounded-lg border border-line px-4 py-1.5 text-[12.5px] text-text-dim hover:text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── ItemRow subcomponent ──────────────────────────────────────────────────────

const SUB_LABEL_CLASS = "text-[9.5px] font-bold uppercase tracking-[0.2em] text-neutral-600";
const ITEM_LABEL_CLASS = "text-[12.5px] text-neutral-400";

function ItemRow({
  item,
  dragMeta,
  handle: externalHandle,
  indent = "pl-12",
  labelClassName,
  isEditing,
  onToggle,
  onEdit,
  onRename,
  onCancelEdit,
  onDelete,
}: {
  item: SidebarItem;
  dragMeta?: DragMeta;
  handle?: React.ReactNode;
  indent?: string;
  labelClassName?: string;
  isEditing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onRename: (v: string) => void;
  onCancelEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    dragMeta
      ? // eslint-disable-next-line react-hooks/rules-of-hooks
        useSortable({ id: item.id, data: dragMeta })
      : { attributes: {}, listeners: {}, setNodeRef: undefined, setActivatorNodeRef: undefined, transform: null, transition: undefined, isDragging: false };

  const style = {
    transform: CSS.Transform.toString(transform ?? null),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handle = externalHandle ?? (dragMeta ? (
    <DragHandle ref={setActivatorNodeRef ?? undefined} {...attributes} {...listeners} />
  ) : null);

  return (
    <div ref={setNodeRef as React.Ref<HTMLDivElement>} style={style}
      className={`mx-2 flex items-center gap-1.5 rounded-lg py-1 ${indent} pr-2 ${item.visible ? "" : "opacity-40"}`}
    >
      {handle}
      {isEditing ? (
        <RenameInput value={item.nombre} onSave={onRename} onCancel={onCancelEdit} />
      ) : (
        <>
          <span className={`flex-1 truncate ${labelClassName ?? ITEM_LABEL_CLASS}`}>{item.nombre}</span>
          {!labelClassName && (
            <span className="hidden truncate text-[10px] text-neutral-700 group-hover:block">{item.ruta}</span>
          )}
        </>
      )}
      <div className="flex shrink-0 items-center gap-0.5">
        {item.esCore ? (
          <span className="p-1"><LockIcon /></span>
        ) : (
          <button type="button" onClick={onDelete} className="rounded p-1 text-neutral-700 hover:text-bad">
            <TrashIcon />
          </button>
        )}
        <button type="button" onClick={onToggle} className={`rounded p-1 transition ${item.visible ? "text-neutral-500 hover:text-neutral-200" : "text-neutral-800 hover:text-neutral-500"}`}>
          <EyeIcon open={item.visible} />
        </button>
        <button type="button" onClick={onEdit} className="rounded p-1 text-neutral-700 hover:text-neutral-300">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-3.5 w-3.5">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
