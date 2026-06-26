"use client";

import { useState, useTransition } from "react";
import { DAYS_SH } from "@/lib/personal/constants";
import { addDaysISO, fmtDateCorta, minToStr, mondayOfWeek } from "@/lib/personal/format";
import { recurOccursOn } from "@/lib/personal/recurrence";
import type { EventBlockVM, EventoUnicoVM, MarkedDateVM } from "@/lib/personal/events";
import {
  crearBloque,
  desmarcarFecha,
  editarBloque,
  eliminarBloque,
  eliminarEventoUnico,
  marcarFecha,
  type BloqueInput,
} from "@/lib/personal/events-actions";
import { FrontChip } from "./FrontChip";
import { BloqueModal } from "./BloqueModal";
import { MarcarFechaModal } from "./MarcarFechaModal";

const ORDEN_SEMANA = [1, 2, 3, 4, 5, 6, 0];

export function CalendarioPageClient({
  events,
  marks,
  eventosUnicos,
}: {
  events: EventBlockVM[];
  marks: MarkedDateVM[];
  eventosUnicos: EventoUnicoVM[];
}) {
  const [modal, setModal] = useState<null | "nuevo" | string>(null);
  const [marcarOpen, setMarcarOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const lunes = mondayOfWeek();
  const editando = typeof modal === "string" ? events.find((e) => e.id === modal) ?? null : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => {
      await action();
      onDone?.();
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Semana
          <span className="h-px w-16 bg-line" />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMarcarOpen(true)}
            className="rounded-lg bg-panel-2 px-4 py-2.5 text-[12.5px] font-semibold text-text-2 hover:text-foreground"
          >
            Marcar fecha
          </button>
          <button
            type="button"
            onClick={() => setModal("nuevo")}
            className="rounded-lg bg-gold px-4 py-2.5 text-[12.5px] font-bold text-[#1a1208] hover:bg-gold-bright"
          >
            + Añadir bloque
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3">
        {ORDEN_SEMANA.map((dow, i) => {
          const iso = addDaysISO(lunes, i);
          const delDia = events.filter((e) => recurOccursOn(e.recur, iso, dow)).sort((a, b) => a.startMin - b.startMin);
          const marca = marks.find((m) => m.date === iso);
          return (
            <div key={dow} className="overflow-hidden rounded-xl border border-line-soft bg-panel">
              <div className="border-b border-line-soft px-3 py-2.5">
                <div className="text-[11px] font-bold text-gold-bright">{DAYS_SH[dow]}</div>
                <div className="text-[10px] text-text-dim">{fmtDateCorta(iso)}</div>
                {marca && <div className="mt-1 text-[10px] text-warn">📌 {marca.note}</div>}
              </div>
              <div className="min-h-[80px] p-2">
                {delDia.length === 0 ? (
                  <p className="px-1 py-2 text-[11px] text-text-dim">—</p>
                ) : (
                  delDia.map((ev) => (
                    <button
                      key={ev.id}
                      type="button"
                      onClick={() => setModal(ev.id)}
                      className="mb-1.5 w-full rounded-lg bg-panel-2 p-2 text-left last:mb-0 hover:bg-panel-3"
                    >
                      <div className="text-[11px] font-semibold">{ev.title}</div>
                      <div className="mt-0.5 text-[10px] text-text-dim">
                        {minToStr(ev.startMin)}–{minToStr(ev.endMin)}
                      </div>
                      <div className="mt-1">
                        <FrontChip front={ev.type} />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Próximos eventos
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-col gap-2">
          {eventosUnicos.length === 0 && <p className="text-sm text-text-dim">Sin eventos puntuales próximos.</p>}
          {eventosUnicos.map((ev) => {
            const fecha = new Date(ev.startAt);
            return (
              <div key={ev.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-panel px-4 py-2.5">
                <div className="min-w-[110px]">
                  <div className="font-heading text-sm font-bold text-gold">{fmtDateCorta(fecha.toISOString().slice(0, 10))}</div>
                  <div className="text-[11px] text-text-dim">{fecha.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <span className="flex-1 text-sm text-text-2">{ev.title}</span>
                <FrontChip front={ev.type} />
                <button type="button" onClick={() => run(() => eliminarEventoUnico(ev.id))} className="px-1.5 text-text-dim hover:text-bad">
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Fechas marcadas
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-col gap-2">
          {marks.length === 0 && <p className="text-sm text-text-dim">Sin fechas marcadas.</p>}
          {marks.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-panel px-4 py-2.5">
              <span className="font-heading text-sm font-bold text-gold">{fmtDateCorta(m.date)}</span>
              <span className="flex-1 text-sm text-text-2">{m.note}</span>
              <button type="button" onClick={() => run(() => desmarcarFecha(m.id))} className="px-1.5 text-text-dim hover:text-bad">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <BloqueModal
        open={modal !== null}
        onClose={() => setModal(null)}
        bloque={editando}
        pending={pending}
        onSubmit={(input: BloqueInput) => run(() => (editando ? editarBloque(editando.id, input) : crearBloque(input)), () => setModal(null))}
        onDelete={editando ? () => run(() => eliminarBloque(editando.id), () => setModal(null)) : undefined}
      />
      <MarcarFechaModal open={marcarOpen} onClose={() => setMarcarOpen(false)} pending={pending} onSubmit={(date, note) => run(() => marcarFecha(date, note), () => setMarcarOpen(false))} />
    </div>
  );
}
