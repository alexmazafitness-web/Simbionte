"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Alto estimado del panel (3 opciones fijas, sin contenido dinámico) — evita
// un segundo render solo para medir, ya que el contenido nunca cambia.
const ALTO_ESTIMADO = 140;
const ANCHO = 208;
const MARGEN = 8;

export function DiaPopover({
  anchorRect,
  onNuevoEvento,
  onNuevoRecordatorio,
  onVerDia,
  onClose,
}: {
  anchorRect: DOMRect;
  onNuevoEvento: () => void;
  onNuevoRecordatorio: () => void;
  onVerDia: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos] = useState(() => {
    const espacioAbajo = window.innerHeight - anchorRect.bottom;
    const arriba = espacioAbajo < ALTO_ESTIMADO + MARGEN && anchorRect.top > ALTO_ESTIMADO + MARGEN;
    const top = arriba ? anchorRect.top - MARGEN : anchorRect.bottom + MARGEN;

    let left = anchorRect.left;
    if (left + ANCHO > window.innerWidth - MARGEN) left = window.innerWidth - ANCHO - MARGEN;
    if (left < MARGEN) left = MARGEN;

    return { top, left, arriba };
  });

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const opciones = [
    { icono: "➕", label: "Nuevo evento", onClick: onNuevoEvento },
    { icono: "🔔", label: "Nuevo recordatorio", onClick: onNuevoRecordatorio },
    { icono: "📅", label: "Ver día", onClick: onVerDia },
  ];

  return createPortal(
    <div
      ref={ref}
      className="fixed z-[70] w-52 rounded-xl border border-white/[0.08] p-1.5 shadow-2xl shadow-black/60"
      style={{
        top: pos.top,
        left: pos.left,
        transform: pos.arriba ? "translateY(-100%)" : undefined,
        background: "#141414",
      }}
    >
      {opciones.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={o.onClick}
          className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] text-neutral-300 transition hover:bg-white/[0.06] hover:text-[#C9A96E]"
        >
          <span className="text-[14px]">{o.icono}</span>
          {o.label}
        </button>
      ))}
    </div>,
    document.body,
  );
}
