"use client";

import { useMemo, useState, useTransition } from "react";
import { CHECKLIST_DEFS } from "@/lib/coaching/contenido-constants";
import type { ChecklistEstadoVM } from "@/lib/coaching/contenido";
import { toggleChecklistItem } from "@/lib/coaching/contenido-actions";
import { toISO, addDaysISO, dowOf, mondayOfWeek, fmtDateCorta } from "@/lib/personal/format";
import { DAYS_SH } from "@/lib/personal/constants";
import {
  FUENTE_LIST, FUENTE_LABEL, FORMATO_LIST, FORMATO_LABEL, ESTADO_LABEL, ESTADO_BG, ESTADO_ACCENT,
  type ContenidoIdeaVM, type ContenidoFuente, type ContenidoFormato, type ContenidoEstado,
} from "@/lib/coaching/contenido-ideas";
import {
  capturarIdeaRapida, crearIdeaCompleta, crearIdeasGeneradas,
  editarIdeaContenido, seleccionarParaSemana, avanzarEstado, descartarIdea, eliminarIdeaContenido,
  type IdeaCompletaInput, type IdeaEditInput,
} from "@/lib/coaching/contenido-ideas-actions";
import { IdeaCompletaModal } from "./IdeaCompletaModal";
import { IdeaEditarModal } from "./IdeaEditarModal";

// ── Checklist (sin cambios) ───────────────────────────────────────────────────

function ChecklistSection({
  titulo, items, estado, pending, onToggle,
}: {
  titulo: string;
  items: typeof CHECKLIST_DEFS;
  estado: ChecklistEstadoVM;
  pending: boolean;
  onToggle: (key: string, checked: boolean) => void;
}) {
  return (
    <div className="mb-7">
      <div className="mb-3 text-[10px] tracking-[0.2em] text-gold-dim uppercase">{titulo}</div>
      <div className="flex flex-col gap-2">
        {items.map((item) => {
          const checked = !!estado[item.key];
          return (
            <div key={item.key} className={`rounded-xl border border-line-soft bg-panel p-4 transition ${checked ? "opacity-55" : ""}`}>
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onToggle(item.key, !checked)}
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold transition ${
                    checked ? "border-gold bg-gold text-[#1a1208]" : "border-text-dim text-transparent"
                  }`}
                >
                  ✓
                </button>
                <div className="flex-1">
                  <div className={`text-[14px] font-semibold ${checked ? "line-through" : ""}`}>{item.titulo}</div>
                  <div className="mt-0.5 text-[12.5px] leading-relaxed text-text-dim">{item.sub}</div>
                  {item.detalle && <div className="mt-2 border-t border-line-soft pt-2 text-[12.5px] leading-relaxed text-text-2">{item.detalle}</div>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Banco de ideas ────────────────────────────────────────────────────────────

function IdeaBancoCard({
  idea, onSeleccionar, onEditar, onDescartar,
}: {
  idea: ContenidoIdeaVM;
  onSeleccionar: () => void;
  onEditar: () => void;
  onDescartar: () => void;
}) {
  const [confirmDescartar, setConfirmDescartar] = useState(false);

  function handleDescartar() {
    if (!confirmDescartar) { setConfirmDescartar(true); return; }
    onDescartar();
  }

  return (
    <div className="group rounded-xl border border-line-soft bg-panel p-3.5 transition hover:border-gold-dim">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {idea.fuente && <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.12em] text-gold-dim uppercase">{FUENTE_LABEL[idea.fuente]}</span>}
        {idea.formato && <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[9.5px] text-text-dim">{FORMATO_LABEL[idea.formato]}</span>}
        <span className="ml-auto text-[10px] text-text-dim">{fmtDateCorta(toISO(new Date(idea.createdAt)))}</span>
      </div>
      <div className="mb-2.5 text-[13px] font-medium leading-snug">{idea.titulo}</div>
      <div className="flex items-center gap-1.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button type="button" onClick={onSeleccionar} className="rounded-md bg-panel-2 px-2 py-1 text-[10.5px] font-semibold text-gold-dim hover:text-gold-bright">
          → Semana
        </button>
        <button type="button" onClick={onEditar} className="rounded-md bg-panel-2 px-2 py-1 text-[10.5px] text-text-dim hover:text-foreground">
          Editar
        </button>
        <button
          type="button"
          onClick={handleDescartar}
          onBlur={() => setConfirmDescartar(false)}
          className={`rounded-md px-2 py-1 text-[10.5px] transition ${confirmDescartar ? "bg-red-600/20 text-red-400" : "bg-panel-2 text-text-dim hover:text-bad"}`}
        >
          {confirmDescartar ? "¿Seguro?" : "Descartar"}
        </button>
      </div>
    </div>
  );
}

// ── Calendario (kanban semanal) ──────────────────────────────────────────────

function PiezaCard({ pieza, onClick }: { pieza: ContenidoIdeaVM; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg p-2.5 text-left transition hover:brightness-110"
      style={{ backgroundColor: ESTADO_BG[pieza.estado], border: `2px solid ${ESTADO_ACCENT[pieza.estado]}33` }}
    >
      <div className="mb-1 flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: ESTADO_ACCENT[pieza.estado] }} />
        <span className="truncate text-[9px] font-semibold tracking-[0.12em] uppercase" style={{ color: ESTADO_ACCENT[pieza.estado] }}>
          {ESTADO_LABEL[pieza.estado]}
        </span>
      </div>
      <div className="text-[12px] leading-snug font-medium text-foreground line-clamp-2">{pieza.titulo}</div>
      {pieza.formato && <div className="mt-1 text-[10px] text-text-dim">{FORMATO_LABEL[pieza.formato]}</div>}
    </button>
  );
}

// ── main component ────────────────────────────────────────────────────────────

type ModalState = null | { type: "completa" } | { type: "editar"; id: string };

export function ContenidoPageClient({
  ideas, checklist,
}: {
  ideas: ContenidoIdeaVM[];
  checklist: ChecklistEstadoVM;
}) {
  const [modal, setModal]           = useState<ModalState>(null);
  const [draftRapida, setDraftRapida] = useState("");
  const [filtroFormato, setFiltroFormato] = useState<ContenidoFormato | "todos">("todos");
  const [filtroFuente, setFiltroFuente]   = useState<ContenidoFuente | "todas">("todas");
  const [weekView, setWeekView]     = useState(() => mondayOfWeek());
  const [generando, setGenerando]   = useState(false);
  const [errorIA, setErrorIA]       = useState("");
  const [pending, startTransition]  = useTransition();

  const hoySemana = useMemo(() => mondayOfWeek(), []);

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => { await action(); onDone?.(); });
  }

  // ── Checklist ────────────────────────────────────────────────────────────────
  const diagItems   = CHECKLIST_DEFS.filter((c) => c.seccion === "diagnostico");
  const perfilItems = CHECKLIST_DEFS.filter((c) => c.seccion === "perfil");
  const totalChecks = CHECKLIST_DEFS.length;
  const doneChecks  = CHECKLIST_DEFS.filter((c) => checklist[c.key]).length;

  // ── Contadores "esta semana" (semana real, no la navegada) ──────────────────
  const piezasEstaSemana = ideas.filter((i) => i.semanaAsignada === hoySemana);
  const nPublicados   = piezasEstaSemana.filter((i) => i.estado === "publicado").length;
  const nEnProduccion = piezasEstaSemana.filter((i) => i.estado === "en_produccion").length;
  const nIdeasBanco    = ideas.filter((i) => i.estado === "idea").length;

  // ── Banco de ideas ────────────────────────────────────────────────────────────
  const banco = ideas
    .filter((i) => i.estado === "idea")
    .filter((i) => filtroFormato === "todos" || i.formato === filtroFormato)
    .filter((i) => filtroFuente === "todas" || i.fuente === filtroFuente);

  // ── Calendario: piezas de la semana navegada, agrupadas por día ─────────────
  const piezasSemanaVista = ideas.filter((i) => i.semanaAsignada === weekView);
  const columnas: ContenidoIdeaVM[][] = Array.from({ length: 7 }, () => []);
  const sinDia: ContenidoIdeaVM[] = [];
  for (const p of piezasSemanaVista) {
    if (p.fechaPublicacion) {
      const dow = dowOf(p.fechaPublicacion);
      columnas[dow === 0 ? 6 : dow - 1]!.push(p);
    } else {
      sinDia.push(p);
    }
  }
  const diasSemana = Array.from({ length: 7 }, (_, i) => addDaysISO(weekView, i));
  const diasLabel = [...DAYS_SH.slice(1), DAYS_SH[0]]; // Lun..Dom

  const editando = modal?.type === "editar" ? ideas.find((i) => i.id === modal.id) ?? null : null;

  async function generarIdeasIA() {
    setGenerando(true);
    setErrorIA("");
    try {
      const res = await fetch("/api/contenido/generar-ideas", { method: "POST" });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as {
        ideas: { titulo: string; descripcion: string; fuente: ContenidoFuente; formato: ContenidoFormato }[];
      };
      run(() => crearIdeasGeneradas(data.ideas ?? []));
    } catch (e) {
      setErrorIA(e instanceof Error ? e.message : "Error generando ideas");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="px-10 py-10">
      {/* ── Checklist de cuenta (sin cambios) ─────────────────────────────── */}
      <div className="mb-7 rounded-2xl border border-gold-dim bg-panel p-5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.2em] text-gold-dim uppercase">Checklist de cuenta</div>
          <div className="text-[12px] text-text-dim">{doneChecks}/{totalChecks}</div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-panel-3">
          <div className="h-full rounded-full bg-gold" style={{ width: `${(doneChecks / totalChecks) * 100}%` }} />
        </div>
      </div>
      <ChecklistSection titulo="Diagnóstico — las tres fugas" items={diagItems} estado={checklist} pending={pending} onToggle={(key, checked) => run(() => toggleChecklistItem(key, checked))} />
      <ChecklistSection titulo="Perfil" items={perfilItems} estado={checklist} pending={pending} onToggle={(key, checked) => run(() => toggleChecklistItem(key, checked))} />

      {/* ── Cabecera del sistema de contenido ─────────────────────────────── */}
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <span className="text-[10px] tracking-[0.24em] text-gold-dim uppercase">Sistema de contenido</span>
        <span className="text-[12px] text-text-dim">
          Esta semana: <span className="font-semibold text-foreground">{nPublicados}</span> publicados ·{" "}
          <span className="font-semibold text-foreground">{nEnProduccion}</span> en producción ·{" "}
          <span className="font-semibold text-foreground">{nIdeasBanco}</span> ideas
        </span>
        <button
          type="button"
          onClick={generarIdeasIA}
          disabled={generando}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-gold-dim px-3.5 py-1.5 text-[12px] font-semibold text-gold-dim transition hover:bg-gold/10 disabled:opacity-50"
        >
          {generando ? "Generando…" : <>✨ Generar ideas con IA</>}
        </button>
      </div>
      {errorIA && <p className="mb-3 text-[12px] text-bad">{errorIA}</p>}

      {/* ── Captura rápida ─────────────────────────────────────────────────── */}
      <div className="mb-7 flex items-center gap-2.5 rounded-xl border border-line-soft bg-panel p-3">
        <input
          value={draftRapida}
          onChange={(e) => setDraftRapida(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draftRapida.trim()) {
              run(() => capturarIdeaRapida(draftRapida.trim()));
              setDraftRapida("");
            }
          }}
          placeholder="¿Qué idea tienes?"
          className="flex-1 rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13.5px] outline-none focus:border-gold-dim placeholder:text-text-dim"
        />
        <button
          type="button"
          disabled={!draftRapida.trim()}
          onClick={() => { run(() => capturarIdeaRapida(draftRapida.trim())); setDraftRapida(""); }}
          className="rounded-lg bg-gold px-4 py-2 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
        >
          Capturar
        </button>
        <button
          type="button"
          onClick={() => setModal({ type: "completa" })}
          className="rounded-lg border border-line px-3.5 py-2 text-[12.5px] font-semibold text-text-2 transition hover:border-gold-dim hover:text-foreground"
        >
          + Idea completa
        </button>
      </div>

      {/* ── Banco de ideas + Calendario ────────────────────────────────────── */}
      <div className="flex items-start gap-5">
        {/* Banco de ideas */}
        <div className="w-[340px] shrink-0">
          <div className="mb-3 flex items-center gap-2">
            <span className="text-[10px] tracking-[0.2em] text-gold-dim uppercase">Banco de ideas</span>
            <span className="rounded-full bg-panel-2 px-2 py-0.5 text-[11px] text-text-dim">{banco.length}</span>
          </div>
          <div className="mb-3 flex gap-1.5">
            <select value={filtroFormato} onChange={(e) => setFiltroFormato(e.target.value as ContenidoFormato | "todos")} className="flex-1 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-[11.5px] outline-none focus:border-gold-dim">
              <option value="todos">Todo formato</option>
              {FORMATO_LIST.map((f) => <option key={f} value={f}>{FORMATO_LABEL[f]}</option>)}
            </select>
            <select value={filtroFuente} onChange={(e) => setFiltroFuente(e.target.value as ContenidoFuente | "todas")} className="flex-1 rounded-lg border border-line bg-panel-2 px-2 py-1.5 text-[11.5px] outline-none focus:border-gold-dim">
              <option value="todas">Toda fuente</option>
              {FUENTE_LIST.map((f) => <option key={f} value={f}>{FUENTE_LABEL[f]}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-2.5">
            {banco.length === 0 && <p className="py-6 text-center text-[12.5px] text-text-dim">Sin ideas que coincidan.</p>}
            {banco.map((idea) => (
              <IdeaBancoCard
                key={idea.id}
                idea={idea}
                onSeleccionar={() => run(() => seleccionarParaSemana(idea.id, mondayOfWeek()))}
                onEditar={() => setModal({ type: "editar", id: idea.id })}
                onDescartar={() => run(() => descartarIdea(idea.id))}
              />
            ))}
          </div>
        </div>

        {/* Calendario de producción */}
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center gap-3">
            <span className="text-[10px] tracking-[0.2em] text-gold-dim uppercase">Calendario de producción</span>
            <div className="ml-auto flex items-center gap-1.5">
              <button type="button" onClick={() => setWeekView((w) => addDaysISO(w, -7))} className="flex h-6 w-6 items-center justify-center rounded text-text-dim hover:bg-panel-2 hover:text-foreground">‹</button>
              <span className="text-[12px] font-medium text-text-2">{fmtDateCorta(weekView)} – {fmtDateCorta(addDaysISO(weekView, 6))}</span>
              <button type="button" onClick={() => setWeekView((w) => addDaysISO(w, 7))} className="flex h-6 w-6 items-center justify-center rounded text-text-dim hover:bg-panel-2 hover:text-foreground">›</button>
              {weekView !== hoySemana && (
                <button type="button" onClick={() => setWeekView(hoySemana)} className="ml-1 rounded px-2 py-0.5 text-[10.5px] text-gold-dim hover:text-gold-bright">Hoy</button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {diasSemana.map((diaISO, i) => {
              const esHoy = diaISO === toISO(new Date());
              return (
                <div key={diaISO} className={`rounded-xl border p-2 ${esHoy ? "border-gold-dim bg-gold/[0.04]" : "border-line-soft bg-panel"}`}>
                  <div className={`mb-2 text-center text-[10px] font-bold tracking-[0.1em] uppercase ${esHoy ? "text-gold-bright" : "text-text-dim"}`}>
                    {diasLabel[i]} <span className="tabular-nums">{diaISO.slice(8, 10)}</span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {columnas[i]!.map((p) => (
                      <PiezaCard key={p.id} pieza={p} onClick={() => setModal({ type: "editar", id: p.id })} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {sinDia.length > 0 && (
            <div className="mt-3">
              <div className="mb-2 text-[10px] font-bold tracking-[0.1em] text-text-dim uppercase">Sin día asignado</div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-2">
                {sinDia.map((p) => (
                  <PiezaCard key={p.id} pieza={p} onClick={() => setModal({ type: "editar", id: p.id })} />
                ))}
              </div>
            </div>
          )}

          {piezasSemanaVista.length === 0 && (
            <p className="py-9 text-center text-[13px] text-text-dim">Sin piezas asignadas a esta semana.</p>
          )}
        </div>
      </div>

      {/* ── Modales ──────────────────────────────────────────────────────────── */}
      <IdeaCompletaModal
        open={modal?.type === "completa"}
        onClose={() => setModal(null)}
        pending={pending}
        onSubmit={(input: IdeaCompletaInput) => run(() => crearIdeaCompleta(input), () => setModal(null))}
      />

      <IdeaEditarModal
        key={editando?.id ?? "none"}
        open={modal?.type === "editar"}
        onClose={() => setModal(null)}
        item={editando}
        pending={pending}
        onSave={(input: IdeaEditInput) => editando && run(() => editarIdeaContenido(editando.id, input), () => setModal(null))}
        onAvanzar={(nuevoEstado, extra) => editando && run(() => avanzarEstado(editando.id, nuevoEstado as ContenidoEstado, extra), () => setModal(null))}
        onDescartar={() => editando && run(() => descartarIdea(editando.id), () => setModal(null))}
        onEliminar={() => editando && run(() => eliminarIdeaContenido(editando.id), () => setModal(null))}
      />
    </div>
  );
}
