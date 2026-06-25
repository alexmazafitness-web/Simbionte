"use client";

import { useState, useTransition } from "react";
import { CHECKLIST_DEFS } from "@/lib/coaching/contenido-constants";
import type { ChecklistEstadoVM, PiezaVM } from "@/lib/coaching/contenido";
import { crearPieza, editarPieza, eliminarPieza, toggleChecklistItem, type PiezaInput } from "@/lib/coaching/contenido-actions";
import { fmtDateCorta } from "@/lib/personal/format";
import { PiezaModal } from "./PiezaModal";

const TIPO_DOT: Record<string, string> = { reel: "bg-gold", story: "bg-[#7FA3C9]", carrusel: "bg-[#B19CD9]", post: "bg-text-2" };

function ChecklistSection({
  titulo,
  items,
  estado,
  pending,
  onToggle,
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

export function ContenidoPageClient({ piezas, checklist }: { piezas: PiezaVM[]; checklist: ChecklistEstadoVM }) {
  const [modal, setModal] = useState<null | "nueva" | string>(null);
  const [pending, startTransition] = useTransition();

  const diagItems = CHECKLIST_DEFS.filter((c) => c.seccion === "diagnostico");
  const perfilItems = CHECKLIST_DEFS.filter((c) => c.seccion === "perfil");
  const totalChecks = CHECKLIST_DEFS.length;
  const doneChecks = CHECKLIST_DEFS.filter((c) => checklist[c.key]).length;

  const editando = typeof modal === "string" ? piezas.find((p) => p.id === modal) ?? null : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-7 rounded-2xl border border-gold-dim bg-panel p-5">
        <div className="flex items-center justify-between">
          <div className="text-[10px] tracking-[0.2em] text-gold-dim uppercase">Checklist de cuenta</div>
          <div className="text-[12px] text-text-dim">
            {doneChecks}/{totalChecks}
          </div>
        </div>
        <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-panel-3">
          <div className="h-full rounded-full bg-gold" style={{ width: `${(doneChecks / totalChecks) * 100}%` }} />
        </div>
      </div>

      <ChecklistSection
        titulo="Diagnóstico — las tres fugas"
        items={diagItems}
        estado={checklist}
        pending={pending}
        onToggle={(key, checked) => run(() => toggleChecklistItem(key, checked))}
      />
      <ChecklistSection
        titulo="Perfil"
        items={perfilItems}
        estado={checklist}
        pending={pending}
        onToggle={(key, checked) => run(() => toggleChecklistItem(key, checked))}
      />

      <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Calendario de contenido
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">{piezas.length}</span>
        <span className="h-px flex-1 bg-line" />
        <button type="button" onClick={() => setModal("nueva")} className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright">
          + Nueva pieza
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {piezas.length === 0 && <p className="py-9 text-center text-text-dim">Sin piezas planificadas todavía.</p>}
        {piezas.map((p) => (
          <button key={p.id} type="button" onClick={() => setModal(p.id)} className="flex items-center gap-3.5 rounded-xl border border-line-soft bg-panel px-4 py-3.5 text-left hover:border-gold-dim">
            <span className={`h-2 w-2 shrink-0 rounded-full ${p.tipo ? TIPO_DOT[p.tipo] : "bg-text-dim"}`} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium">{p.titulo}</span>
            <span className="text-[11px] text-text-dim">{fmtDateCorta(p.fechaPublicacion)}</span>
            <span className="rounded-md bg-panel-3 px-2 py-0.5 text-[11px] text-text-2 capitalize">{p.estado}</span>
          </button>
        ))}
      </div>

      <PiezaModal
        open={modal !== null}
        onClose={() => setModal(null)}
        pieza={editando}
        pending={pending}
        onSubmit={(input: PiezaInput) => run(() => (editando ? editarPieza(editando.id, input) : crearPieza(input)), () => setModal(null))}
        onDelete={editando ? () => run(() => eliminarPieza(editando.id), () => setModal(null)) : undefined}
      />
    </div>
  );
}
