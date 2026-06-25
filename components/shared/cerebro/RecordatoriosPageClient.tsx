"use client";

import { useState, useTransition } from "react";
import type { ReminderVM } from "@/lib/personal/reminders";
import {
  crearRecordatorio,
  editarRecordatorio,
  eliminarRecordatorio,
  marcarRecordatorioHecho,
} from "@/lib/personal/reminders-actions";
import type { Front } from "@/lib/personal/constants";
import { FrontChip } from "./FrontChip";
import { RecordatorioModal } from "./RecordatorioModal";

function estadoPill(whenISO: string, done: boolean): { label: string; cls: string } {
  if (done) return { label: "Hecho", cls: "text-text-dim" };
  const diffMs = new Date(whenISO).getTime() - Date.now();
  if (diffMs < 0) return { label: "Vencido", cls: "text-bad" };
  if (diffMs < 6 * 60 * 60 * 1000) return { label: "Pronto", cls: "text-warn" };
  return { label: "Programado", cls: "text-text-2" };
}

export function RecordatoriosPageClient({ reminders }: { reminders: ReminderVM[] }) {
  const [modal, setModal] = useState<null | "nuevo" | string>(null);
  const [pending, startTransition] = useTransition();

  const editando = typeof modal === "string" ? reminders.find((r) => r.id === modal) ?? null : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center justify-end">
        <button
          type="button"
          onClick={() => setModal("nuevo")}
          className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright"
        >
          + Nuevo recordatorio
        </button>
      </div>

      <div className="flex flex-col gap-2.5">
        {reminders.length === 0 && <p className="py-9 text-center text-text-dim">No tienes recordatorios.</p>}
        {reminders.map((r) => {
          const fecha = new Date(r.whenISO);
          const estado = estadoPill(r.whenISO, r.done);
          return (
            <div key={r.id} className="flex items-center gap-3 rounded-xl border border-line-soft bg-panel px-4 py-3.5">
              <input
                type="checkbox"
                checked={r.done}
                onChange={(e) => run(() => marcarRecordatorioHecho(r.id, e.target.checked))}
                className="h-[18px] w-[18px]"
              />
              <div className="min-w-0 flex-1">
                <div className={`text-sm ${r.done ? "text-text-dim line-through" : ""}`}>{r.text}</div>
                <div className="mt-1 flex items-center gap-1.5">
                  <FrontChip front={r.front} />
                  <span className="text-[11px] text-text-dim">
                    {fecha.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} ·{" "}
                    {fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <span className={`text-[11px] font-semibold ${estado.cls}`}>{estado.label}</span>
                </div>
              </div>
              <button type="button" onClick={() => setModal(r.id)} className="px-1.5 text-text-dim hover:text-gold-bright">
                ✎
              </button>
              <button type="button" onClick={() => run(() => eliminarRecordatorio(r.id))} className="px-1.5 text-text-dim hover:text-bad">
                ✕
              </button>
            </div>
          );
        })}
      </div>

      <RecordatorioModal
        open={modal !== null}
        onClose={() => setModal(null)}
        recordatorio={editando}
        pending={pending}
        onSubmit={(text: string, whenISO: string, front: Front) =>
          run(() => (editando ? editarRecordatorio(editando.id, text, whenISO, front) : crearRecordatorio(text, whenISO, front)), () => setModal(null))
        }
      />
    </div>
  );
}
