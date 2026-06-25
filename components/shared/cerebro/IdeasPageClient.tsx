"use client";

import { useState, useTransition } from "react";
import { Chip } from "@/components/ui/Chip";
import type { IdeaVM } from "@/lib/personal/ideas";
import { archivarIdea, convertirIdeaATarea, crearIdea, eliminarIdea } from "@/lib/personal/ideas-actions";
import { FrontChip } from "./FrontChip";
import { IdeaModal } from "./IdeaModal";

export function IdeasPageClient({ ideas }: { ideas: IdeaVM[] }) {
  const [tab, setTab] = useState<"abierta" | "archivada">("abierta");
  const [modalOpen, setModalOpen] = useState(false);
  const [pending, startTransition] = useTransition();

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
          onClick={() => setModalOpen(true)}
          className="ml-auto rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright"
        >
          + Nueva idea
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {lista.length === 0 && <p className="py-9 text-center text-text-dim">No hay ideas aquí.</p>}
        {lista.map((idea) => (
          <div key={idea.id} className="rounded-xl border border-line-soft bg-panel p-4">
            <div className="text-sm">{idea.text}</div>
            <div className="mt-2.5 flex items-center gap-2">
              <FrontChip front={idea.front} />
              <div className="ml-auto flex gap-2">
                {idea.estado === "abierta" && (
                  <button
                    type="button"
                    onClick={() => run(() => convertirIdeaATarea(idea.id, idea.text, idea.front))}
                    className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-gold-dim hover:text-gold-bright"
                  >
                    → Convertir en tarea
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => run(() => archivarIdea(idea.id, idea.estado === "abierta"))}
                  className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-foreground"
                >
                  {idea.estado === "abierta" ? "Archivar" : "Reabrir"}
                </button>
                <button
                  type="button"
                  onClick={() => run(() => eliminarIdea(idea.id))}
                  className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-bad"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <IdeaModal open={modalOpen} onClose={() => setModalOpen(false)} pending={pending} onSubmit={(text, front) => run(() => crearIdea(text, front), () => setModalOpen(false))} />
    </div>
  );
}
