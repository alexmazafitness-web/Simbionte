"use client";

import { useState, useTransition } from "react";
import { INFRA_BUCKETS, type InfraBucket } from "@/lib/personal/constants";
import type { InfraItemVM } from "@/lib/personal/infra";
import type { CredencialVM } from "@/lib/personal/credenciales";
import { crearInfraItem, editarInfraItem, eliminarInfraItem, type InfraItemInput } from "@/lib/personal/infra-actions";
import { InfraModal } from "./InfraModal";
import { CredencialesSection } from "./CredencialesSection";

export function InfraPageClient({ items, credenciales }: { items: InfraItemVM[]; credenciales: CredencialVM[] }) {
  const [modal, setModal] = useState<null | { bucket: InfraBucket; id?: string }>(null);
  const [pending, startTransition] = useTransition();

  const editando = modal?.id ? items.find((i) => i.id === modal.id) ?? null : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="flex flex-col gap-8">
        {INFRA_BUCKETS.map((bucket) => {
          const items_ = items.filter((i) => i.bucket === bucket.id);
          return (
            <div key={bucket.id}>
              <div className="mb-3 flex items-center gap-2.5">
                <span className="text-sm font-semibold">
                  {bucket.emoji} {bucket.name}
                </span>
                <span className="text-[11px] text-text-dim">{bucket.sub}</span>
                <button
                  type="button"
                  onClick={() => setModal({ bucket: bucket.id })}
                  className="ml-auto rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-2 hover:text-foreground"
                >
                  + Añadir
                </button>
              </div>
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {items_.length === 0 && <p className="text-sm text-text-dim">Sin activos en este cajón.</p>}
                {items_.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setModal({ bucket: bucket.id, id: item.id })}
                    className="rounded-xl border border-line-soft bg-panel p-4 text-left hover:border-gold-dim"
                  >
                    <div className="text-[13.5px] font-semibold">{item.name}</div>
                    {item.desc && <div className="mt-1 text-[12px] text-text-2">{item.desc}</div>}
                    <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-text-dim">
                      {item.platform && <span className="rounded-md bg-panel-3 px-2 py-0.5">{item.platform}</span>}
                      {item.note && <span>{item.note}</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <InfraModal
        open={modal !== null}
        onClose={() => setModal(null)}
        item={editando}
        bucketPorDefecto={modal?.bucket ?? "personal"}
        pending={pending}
        onSubmit={(input: InfraItemInput) => run(() => (editando ? editarInfraItem(editando.id, input) : crearInfraItem(input)), () => setModal(null))}
        onDelete={editando ? () => run(() => eliminarInfraItem(editando.id), () => setModal(null)) : undefined}
      />

      <CredencialesSection credenciales={credenciales} />
    </div>
  );
}
