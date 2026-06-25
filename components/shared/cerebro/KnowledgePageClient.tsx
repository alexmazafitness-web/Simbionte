"use client";

import { useState, useTransition } from "react";
import type { KnCategoryVM, KnNoteVM, KnPrincipleVM, KnSystemVM } from "@/lib/personal/knowledge";
import {
  crearCategoria,
  crearNota,
  crearPrincipio,
  crearSistema,
  editarNota,
  editarPrincipio,
  editarSistema,
  eliminarNota,
  eliminarPrincipio,
  eliminarSistema,
} from "@/lib/personal/knowledge-actions";
import { CategoriaModal } from "./CategoriaModal";
import { NotaModal } from "./NotaModal";
import { PrincipioModal } from "./PrincipioModal";
import { SistemaModal } from "./SistemaModal";

type ModalState =
  | null
  | { type: "nota"; categoriaId: string | null; id?: string }
  | { type: "principio"; id?: string }
  | { type: "sistema"; id?: string }
  | { type: "categoria" };

export function KnowledgePageClient({
  categorias,
  notas,
  principios,
  sistemas,
}: {
  categorias: KnCategoryVM[];
  notas: KnNoteVM[];
  principios: KnPrincipleVM[];
  sistemas: KnSystemVM[];
}) {
  const [modal, setModal] = useState<ModalState>(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  const notaEditando = modal?.type === "nota" && modal.id ? notas.find((n) => n.id === modal.id) ?? null : null;
  const principioEditando = modal?.type === "principio" && modal.id ? principios.find((p) => p.id === modal.id) ?? null : null;
  const sistemaEditando = modal?.type === "sistema" && modal.id ? sistemas.find((s) => s.id === modal.id) ?? null : null;

  return (
    <div className="px-10 py-10">
      <p className="mb-7 text-sm text-text-dim">Tu conocimiento organizado y conectado.</p>

      <div className="mb-7 rounded-2xl border border-line-soft bg-panel p-5 opacity-60">
        <div className="mb-2 text-[10px] tracking-[0.2em] text-gold-dim uppercase">Pregunta a tu Segundo Cerebro</div>
        <p className="text-sm text-text-dim">Próximamente — Q&amp;A con IA sobre todo tu conocimiento guardado.</p>
      </div>

      <div className="mb-7 rounded-2xl border border-dashed border-line bg-panel p-5 opacity-60">
        <div className="mb-2 text-[10px] tracking-[0.2em] text-gold-dim uppercase">Captura rápida</div>
        <p className="text-sm text-text-dim">Próximamente — desarrollo automático con IA de ideas sueltas. Usa &quot;+ Añadir&quot; en cada sección por ahora.</p>
      </div>

      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[10px] tracking-[0.2em] text-gold uppercase">★ Principios maestros</span>
        <button type="button" onClick={() => setModal({ type: "principio" })} className="ml-auto rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-2 hover:text-foreground">
          + Añadir
        </button>
      </div>
      <div className="mb-8 flex flex-col gap-2">
        {principios.length === 0 && <p className="text-sm text-text-dim">Sin principios todavía.</p>}
        {principios.map((p) => (
          <button key={p.id} type="button" onClick={() => setModal({ type: "principio", id: p.id })} className="rounded-xl border border-line-soft bg-panel p-3.5 text-left hover:border-gold-dim">
            <div className="text-[13.5px]">{p.text}</div>
            {p.source && <div className="mt-1 text-[11px] text-text-dim">{p.source}</div>}
          </button>
        ))}
      </div>

      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[10px] tracking-[0.2em] text-text-2 uppercase">Conocimiento</span>
        <button type="button" onClick={() => setModal({ type: "categoria" })} className="ml-auto rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-2 hover:text-foreground">
          + Categoría
        </button>
      </div>
      <div className="mb-8 flex flex-col gap-4">
        {categorias.map((cat) => {
          const notasCat = notas.filter((n) => n.categoryId === cat.id);
          return (
            <div key={cat.id} className="rounded-2xl border border-line-soft bg-panel p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold">
                  {cat.emoji} {cat.name}
                </span>
                <span className="rounded-full bg-panel-3 px-2 py-0.5 text-[10.5px] text-text-dim">{notasCat.length}</span>
                <button
                  type="button"
                  onClick={() => setModal({ type: "nota", categoriaId: cat.id })}
                  className="ml-auto rounded-md bg-panel-2 px-2.5 py-1 text-[11px] font-semibold text-gold-dim hover:text-gold-bright"
                >
                  + Nota
                </button>
              </div>
              {notasCat.length > 0 && (
                <div className="mt-3 flex flex-col gap-2">
                  {notasCat.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => setModal({ type: "nota", categoriaId: cat.id, id: n.id })}
                      className="rounded-lg bg-panel-2 p-2.5 text-left hover:bg-panel-3"
                    >
                      <div className="text-[13px] font-medium">{n.title}</div>
                      {n.text && <div className="mt-0.5 text-[12px] text-text-2">{n.text}</div>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mb-3 flex items-center gap-2.5">
        <span className="text-[10px] tracking-[0.2em] text-text-2 uppercase">Sistemas</span>
        <button type="button" onClick={() => setModal({ type: "sistema" })} className="ml-auto rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-2 hover:text-foreground">
          + Añadir
        </button>
      </div>
      <div className="flex flex-col gap-2">
        {sistemas.length === 0 && <p className="text-sm text-text-dim">Sin sistemas todavía.</p>}
        {sistemas.map((s) => (
          <button key={s.id} type="button" onClick={() => setModal({ type: "sistema", id: s.id })} className="rounded-xl border border-line-soft bg-panel p-3.5 text-left hover:border-gold-dim">
            <div className="text-[13.5px] font-semibold">{s.name}</div>
            {s.desc && <div className="mt-1 text-[12px] text-text-2">{s.desc}</div>}
          </button>
        ))}
      </div>

      <NotaModal
        open={modal?.type === "nota"}
        onClose={() => setModal(null)}
        nota={notaEditando}
        categorias={categorias}
        categoriaPorDefecto={modal?.type === "nota" ? modal.categoriaId : null}
        pending={pending}
        onSubmit={(title, text, source, categoryId) =>
          run(() => (notaEditando ? editarNota(notaEditando.id, title, text, source, categoryId) : crearNota(title, text, source, categoryId)), () => setModal(null))
        }
        onDelete={notaEditando ? () => run(() => eliminarNota(notaEditando.id), () => setModal(null)) : undefined}
      />

      <PrincipioModal
        open={modal?.type === "principio"}
        onClose={() => setModal(null)}
        principio={principioEditando}
        pending={pending}
        onSubmit={(text, source) =>
          run(() => (principioEditando ? editarPrincipio(principioEditando.id, text, source) : crearPrincipio(text, source)), () => setModal(null))
        }
        onDelete={principioEditando ? () => run(() => eliminarPrincipio(principioEditando.id), () => setModal(null)) : undefined}
      />

      <SistemaModal
        open={modal?.type === "sistema"}
        onClose={() => setModal(null)}
        sistema={sistemaEditando}
        pending={pending}
        onSubmit={(name, desc) => run(() => (sistemaEditando ? editarSistema(sistemaEditando.id, name, desc) : crearSistema(name, desc)), () => setModal(null))}
        onDelete={sistemaEditando ? () => run(() => eliminarSistema(sistemaEditando.id), () => setModal(null)) : undefined}
      />

      <CategoriaModal open={modal?.type === "categoria"} onClose={() => setModal(null)} pending={pending} onSubmit={(emoji, name) => run(() => crearCategoria(emoji, name), () => setModal(null))} />
    </div>
  );
}
