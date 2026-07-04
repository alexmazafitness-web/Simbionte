"use client";

import { useState, useTransition } from "react";
import { Chip } from "@/components/ui/Chip";
import type { IdeaVM } from "@/lib/personal/ideas";
import { archivarIdea, convertirIdeaATarea, crearIdea, editarIdea, eliminarIdea } from "@/lib/personal/ideas-actions";
import { FrontChip } from "./FrontChip";
import { IdeaModal } from "./IdeaModal";

export function IdeasPageClient({ ideas }: { ideas: IdeaVM[] }) {
  const [tab, setTab] = useState<"abierta" | "archivada">("abierta");
  const [modal, setModal] = useState<null | { id?: string }>(null);
  const [pending, startTransition] = useTransition();

  const editando = modal?.id ? ideas.find((i) => i.id === modal.id) ?? null : null;
  const lista = ideas.filter((i) => i.estado === tab);

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex gap-1.5">
          <Chip active={tab === "abierta"} onClick={() => setTab("abierta")}>
            Abiertas
          </Chip>
          <Chip active={tab === "archivada"} onClick={() => setTab("archivada")}>
            Archivadas
          </Chip>
        </div>
        <button
          type="button"
          onClick={() => setModal({})}
          className="ml-auto rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright"
        >
          + Nueva idea
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {lista.length === 0 && <p className="py-9 text-center text-text-dim">No hay ideas aquí.</p>}
        {lista.map((idea) => (
          <div
            key={idea.id}
            role="button"
            tabIndex={0}
            onClick={() => setModal({ id: idea.id })}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setModal({ id: idea.id }); } }}
            className="group cursor-pointer rounded-xl border border-line-soft bg-panel p-4 transition hover:border-gold-dim"
          >
            <div className="flex items-start gap-2">
              <div className="flex-1 text-sm">{idea.text}</div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setModal({ id: idea.id }); }}
                className="shrink-0 rounded p-1 text-text-dim opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                title="Editar"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <FrontChip front={idea.front} />
              <div className="ml-auto flex gap-2">
                {idea.estado === "abierta" && (
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); run(() => convertirIdeaATarea(idea.id, idea.text, idea.front)); }}
                    className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-gold-dim hover:text-gold-bright"
                  >
                    → Convertir en tarea
                  </button>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); run(() => archivarIdea(idea.id, idea.estado === "abierta")); }}
                  className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-foreground"
                >
                  {idea.estado === "abierta" ? "Archivar" : "Reabrir"}
                </button>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); run(() => eliminarIdea(idea.id)); }}
                  className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-bad"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <IdeaModal
        key={modal?.id ?? "new"}
        open={modal !== null}
        onClose={() => setModal(null)}
        idea={editando}
        pending={pending}
        onSubmit={(text, front) =>
          run(() => (editando ? editarIdea(editando.id, text, front) : crearIdea(text, front)), () => setModal(null))
        }
      />
    </div>
  );
}
