"use client";

import { DAYS_PLURAL } from "@/lib/personal/constants";

interface Props {
  open: boolean;
  dow: number;        // day-of-week of the block being moved
  onHoy: () => void;
  onTodos: () => void;
  onCancel: () => void;
}

export function CalMovDialog({ open, dow, onHoy, onTodos, onCancel }: Props) {
  if (!open) return null;

  const diaPlural = DAYS_PLURAL[dow] ?? "estos días";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Scrim */}
      <div className="absolute inset-0 bg-black/60" onClick={onCancel} />

      {/* Panel */}
      <div
        className="relative z-10 w-72 rounded-2xl p-5"
        style={{ background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <p className="mb-1 text-[13px] font-semibold text-white">¿Mover bloque?</p>
        <p className="mb-4 text-[12px] text-neutral-500">
          ¿Cambiar solo el horario de hoy o todos los {diaPlural}?
        </p>

        <button
          type="button"
          onClick={onHoy}
          className="mb-2 w-full rounded-lg py-2.5 text-[13px] font-semibold transition hover:brightness-110"
          style={{ background: "rgba(201,169,110,.15)", color: "#C9A96E", border: "1px solid rgba(201,169,110,.25)" }}
        >
          Solo hoy
        </button>

        <button
          type="button"
          onClick={onTodos}
          className="mb-2 w-full rounded-lg py-2.5 text-[13px] font-semibold transition hover:brightness-110"
          style={{ background: "rgba(255,255,255,.06)", color: "#e5e5e5", border: "1px solid rgba(255,255,255,.1)" }}
        >
          Todos los {diaPlural}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg py-2 text-[12px] text-neutral-600 hover:text-neutral-400"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
