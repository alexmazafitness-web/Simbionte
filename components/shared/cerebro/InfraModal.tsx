"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { INFRA_BUCKETS, INFRA_PLATFORMS, type InfraBucket } from "@/lib/personal/constants";
import type { InfraItemVM } from "@/lib/personal/infra";
import type { InfraItemInput } from "@/lib/personal/infra-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

export function InfraModal({
  open,
  onClose,
  item,
  bucketPorDefecto,
  pending,
  onSubmit,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  item: InfraItemVM | null;
  bucketPorDefecto: InfraBucket;
  pending: boolean;
  onSubmit: (input: InfraItemInput) => void;
  onDelete?: () => void;
}) {
  const [bucket, setBucket] = useState<InfraBucket>(item?.bucket ?? bucketPorDefecto);
  const [name, setName] = useState(item?.name ?? "");
  const [desc, setDesc] = useState(item?.desc ?? "");
  const [platform, setPlatform] = useState(item?.platform ?? INFRA_PLATFORMS[0]);
  const [url, setUrl] = useState(item?.url ?? "");
  const [note, setNote] = useState(item?.note ?? "");

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({ bucket, name: name.trim(), desc, platform, url, note });
  }

  return (
    <Modal open={open} onClose={onClose} title={item ? "Editar activo" : "Nuevo activo"}>
      <form onSubmit={handleSubmit}>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nombre</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="Ej: Worker evaluación" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Qué es</label>
          <input className={inputClass} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Ej: formulario → email" />
        </div>
        <div className="mb-3.5 grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Cajón</label>
            <select className={inputClass} value={bucket} onChange={(e) => setBucket(e.target.value as InfraBucket)}>
              {INFRA_BUCKETS.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Plataforma</label>
            <select className={inputClass} value={platform} onChange={(e) => setPlatform(e.target.value)}>
              {INFRA_PLATFORMS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Enlace (URL)</label>
          <input className={inputClass} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…" />
        </div>
        <div className="mb-3.5">
          <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">Nota (opcional)</label>
          <input className={inputClass} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Clave, pendiente, contexto…" />
        </div>
        <div className="mt-2 flex gap-2.5">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
            Cancelar
          </button>
          <button type="submit" disabled={pending} className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50">
            Guardar
          </button>
        </div>
        {item && onDelete && (
          <button type="button" onClick={onDelete} className="mt-2.5 w-full rounded-lg bg-bad-bg py-2.5 text-[13.5px] font-semibold text-bad hover:bg-[rgba(217,98,74,.2)]">
            Eliminar
          </button>
        )}
      </form>
    </Modal>
  );
}
