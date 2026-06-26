"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { ExportarDatosButton } from "./ExportarDatosButton";

type Seccion = "general";

const SECCIONES: { id: Seccion; label: string }[] = [{ id: "general", label: "General" }];

export function AjustesModal({
  open,
  onClose,
  name,
  email,
}: {
  open: boolean;
  onClose: () => void;
  name: string | null;
  email: string | null;
}) {
  const [seccion, setSeccion] = useState<Seccion>("general");

  return (
    <Modal open={open} onClose={onClose} title="Ajustes" widthClassName="w-[620px]">
      <div className="-m-6 flex h-[420px]">
        <div className="w-40 shrink-0 border-r border-line-soft p-4">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              className={`block w-full rounded-md px-3 py-2 text-left text-[13px] font-medium transition ${
                seccion === s.id ? "bg-[rgba(201,169,110,.14)] text-gold-bright" : "text-text-2 hover:bg-panel-2"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {seccion === "general" && (
            <div>
              <div className="mb-6 flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A96E] to-[#9a7c47] text-lg font-bold text-[#1a1208]">
                  {name ? name[0]!.toUpperCase() : "?"}
                </span>
                <div className="min-w-0">
                  <div className="truncate font-heading text-base font-bold">{name ?? "Sin sesión"}</div>
                  <div className="truncate text-[12.5px] text-text-dim">{email ?? "—"}</div>
                </div>
              </div>

              <div className="border-t border-line-soft pt-5">
                <div className="mb-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">Backup de seguridad</div>
                <p className="mb-4 text-[13px] leading-relaxed text-text-2">
                  Descarga un archivo JSON con todos tus datos de Personal y Coaching, tal como están ahora en Supabase.
                </p>
                <ExportarDatosButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
