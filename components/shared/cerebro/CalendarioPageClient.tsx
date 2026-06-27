"use client";

import { useState, useTransition } from "react";
import { DAYS_SH, FRONT_COLOR } from "@/lib/personal/constants";
import {
  addDaysISO, dowOf, fmtDateCorta, minToStr,
  mondayOfWeek, todayISO, toISO,
} from "@/lib/personal/format";
import { recurOccursOn } from "@/lib/personal/recurrence";
import type { EventBlockVM, EventoUnicoVM, MarkedDateVM } from "@/lib/personal/events";
import {
  crearBloque, desmarcarFecha, editarBloque, eliminarBloque,
  eliminarEventoUnico, marcarFecha, type BloqueInput,
} from "@/lib/personal/events-actions";
import { FrontChip } from "./FrontChip";
import { BloqueModal } from "./BloqueModal";
import { MarcarFechaModal } from "./MarcarFechaModal";

type Vista = "dia" | "semana" | "mes" | "año";

const MESES_L = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];
const H_START = 7;
const H_END   = 22;
const HOUR_H  = 60; // px per hour in day view

// ── pure helpers ──────────────────────────────────────────────────────────────

function addMonths(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return toISO(d);
}

function unikoMin(startAt: string): number {
  const d = new Date(startAt);
  return d.getHours() * 60 + d.getMinutes();
}

function eventsOn(iso: string, ev: EventBlockVM[], unicos: EventoUnicoVM[]) {
  const dow = dowOf(iso);
  return {
    blocks: ev.filter((e) => recurOccursOn(e.recur, iso, dow)).sort((a, b) => a.startMin - b.startMin),
    unicos: unicos.filter((u) => u.startAt.slice(0, 10) === iso),
  };
}

// ── component ─────────────────────────────────────────────────────────────────

export function CalendarioPageClient({
  events,
  marks,
  eventosUnicos,
}: {
  events: EventBlockVM[];
  marks: MarkedDateVM[];
  eventosUnicos: EventoUnicoVM[];
}) {
  const [vista,      setVista]      = useState<Vista>("semana");
  const [cursor,     setCursor]     = useState(todayISO);
  const [modal,      setModal]      = useState<null | "nuevo" | string>(null);
  const [marcarOpen, setMarcarOpen] = useState(false);
  const [, startTransition]         = useTransition();

  const today    = todayISO();
  const editando =
    typeof modal === "string" && modal !== "nuevo"
      ? (events.find((e) => e.id === modal) ?? null)
      : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => { await action(); onDone?.(); });
  }

  function nav(dir: 1 | -1) {
    setCursor((c) => {
      if (vista === "dia")    return addDaysISO(c, dir);
      if (vista === "semana") return addDaysISO(c, 7 * dir);
      if (vista === "mes")    return addMonths(c, dir);
      return addMonths(c, 12 * dir);
    });
  }

  function periodoLabel(): string {
    const d = new Date(cursor + "T00:00:00");
    if (vista === "dia") {
      const s = d.toLocaleDateString("es-ES", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    if (vista === "semana") {
      const lun = mondayOfWeek(cursor);
      return `${fmtDateCorta(lun)} – ${fmtDateCorta(addDaysISO(lun, 6))}`;
    }
    if (vista === "mes") return `${MESES_L[d.getMonth()]} ${d.getFullYear()}`;
    return String(d.getFullYear());
  }

  // ── Vista Día ──────────────────────────────────────────────────────────────

  function renderDia() {
    const { blocks, unicos: uDay } = eventsOn(cursor, events, eventosUnicos);
    const marca    = marks.find((m) => m.date === cursor);
    const hours    = Array.from({ length: H_END - H_START + 1 }, (_, i) => H_START + i);
    const totalPx  = (H_END - H_START) * HOUR_H;

    return (
      <div>
        {marca && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-warn/30 bg-warn/5 px-4 py-2.5 text-[12.5px] text-warn">
            📌 {marca.note}
          </div>
        )}
        {blocks.length === 0 && uDay.length === 0 && (
          <p className="mb-4 text-[13px] text-text-dim">Sin bloques para este día.</p>
        )}
        <div className="overflow-hidden rounded-xl border border-line-soft bg-panel">
          <div className="relative" style={{ height: totalPx }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute inset-x-0 flex" style={{ top: i * HOUR_H }}>
                <span className="w-14 shrink-0 -translate-y-2 select-none pr-3 text-right text-[10.5px] tabular-nums text-text-dim">
                  {String(h).padStart(2, "0")}:00
                </span>
                <div className="flex-1 border-t border-line-soft" />
              </div>
            ))}

            <div className="absolute inset-0 left-14 pr-3">
              {blocks.map((ev) => {
                const topMin = Math.max(ev.startMin - H_START * 60, 0);
                const top    = (topMin / 60) * HOUR_H + 2;
                const height = Math.max(((ev.endMin - ev.startMin) / 60) * HOUR_H - 4, 22);
                return (
                  <button
                    key={ev.id}
                    type="button"
                    onClick={() => setModal(ev.id)}
                    className="absolute left-0 w-full rounded-lg px-2.5 py-1 text-left transition hover:brightness-110"
                    style={{
                      top, height,
                      backgroundColor: FRONT_COLOR[ev.type] + "18",
                      borderLeft: `3px solid ${FRONT_COLOR[ev.type]}`,
                    }}
                  >
                    <div className="truncate text-[11.5px] font-semibold leading-tight" style={{ color: FRONT_COLOR[ev.type] }}>
                      {ev.title}
                    </div>
                    {height > 34 && (
                      <div className="text-[10px] text-text-dim">
                        {minToStr(ev.startMin)}–{minToStr(ev.endMin)}
                      </div>
                    )}
                  </button>
                );
              })}

              {uDay.map((ev) => {
                const topMin = Math.max(unikoMin(ev.startAt) - H_START * 60, 0);
                const top    = (topMin / 60) * HOUR_H + 2;
                return (
                  <div
                    key={ev.id}
                    className="absolute left-0 w-full rounded-lg px-2.5 py-1"
                    style={{
                      top, height: 40,
                      backgroundColor: FRONT_COLOR[ev.type] + "18",
                      borderLeft: `3px solid ${FRONT_COLOR[ev.type]}`,
                    }}
                  >
                    <div className="truncate text-[11.5px] font-semibold leading-tight" style={{ color: FRONT_COLOR[ev.type] }}>
                      {ev.title}
                    </div>
                    <div className="text-[10px] text-text-dim">
                      {new Date(ev.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista Semana ───────────────────────────────────────────────────────────

  function renderSemana() {
    const lunes = mondayOfWeek(cursor);
    const ORDEN = [1, 2, 3, 4, 5, 6, 0] as const;
    return (
      <div className="grid grid-cols-7 gap-3">
        {ORDEN.map((dow, i) => {
          const iso     = addDaysISO(lunes, i);
          const { blocks, unicos: uDay } = eventsOn(iso, events, eventosUnicos);
          const marca   = marks.find((m) => m.date === iso);
          const isToday = iso === today;
          return (
            <div
              key={dow}
              className={`overflow-hidden rounded-xl border bg-panel ${isToday ? "border-gold/40" : "border-line-soft"}`}
            >
              <div className={`border-b px-3 py-2.5 ${isToday ? "border-gold/30 bg-[rgba(201,169,110,.06)]" : "border-line-soft"}`}>
                <div className={`text-[11px] font-bold ${isToday ? "text-gold" : "text-gold-bright"}`}>{DAYS_SH[dow]}</div>
                <div className={`text-[10px] ${isToday ? "text-gold/70" : "text-text-dim"}`}>{fmtDateCorta(iso)}</div>
                {marca && <div className="mt-1 text-[10px] text-warn">📌 {marca.note}</div>}
              </div>
              <div className="min-h-[80px] p-2">
                {blocks.length === 0 && uDay.length === 0 ? (
                  <p className="px-1 py-2 text-[11px] text-text-dim">—</p>
                ) : (
                  <>
                    {blocks.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => setModal(ev.id)}
                        className="mb-1.5 w-full rounded-lg bg-panel-2 p-2 text-left last:mb-0 hover:bg-panel-3"
                      >
                        <div className="text-[11px] font-semibold">{ev.title}</div>
                        <div className="mt-0.5 text-[10px] text-text-dim">{minToStr(ev.startMin)}–{minToStr(ev.endMin)}</div>
                        <div className="mt-1"><FrontChip front={ev.type} /></div>
                      </button>
                    ))}
                    {uDay.map((ev) => (
                      <div key={ev.id} className="mb-1.5 rounded-lg bg-panel-2 p-2 last:mb-0">
                        <div className="text-[11px] font-semibold">{ev.title}</div>
                        <div className="mt-0.5 text-[10px] text-text-dim">
                          {new Date(ev.startAt).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
                        </div>
                        <div className="mt-1"><FrontChip front={ev.type} /></div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── Vista Mes ──────────────────────────────────────────────────────────────

  function renderMes() {
    const d0      = new Date(cursor + "T00:00:00");
    const y       = d0.getFullYear();
    const m       = d0.getMonth();
    const numDays = new Date(y, m + 1, 0).getDate();
    let   fdow    = new Date(y, m, 1).getDay();
    fdow = fdow === 0 ? 6 : fdow - 1; // 0=Lun…6=Dom
    const cells   = Math.ceil((fdow + numDays) / 7) * 7;

    return (
      <div className="overflow-hidden rounded-xl border border-line-soft bg-panel">
        <div className="grid grid-cols-7 border-b border-line-soft">
          {["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((dh) => (
            <div key={dh} className="border-r border-line-soft/50 py-2.5 text-center text-[10px] font-semibold tracking-wider text-text-dim uppercase last:border-r-0">
              {dh}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: cells }, (_, i) => {
            const day      = i - fdow + 1;
            const inMonth  = day >= 1 && day <= numDays;
            const isLastRow = Math.floor(i / 7) === Math.floor((cells - 1) / 7);
            const isLastCol = (i + 1) % 7 === 0;
            const borders   = `${!isLastRow ? "border-b border-line-soft" : ""} ${!isLastCol ? "border-r border-line-soft" : ""}`;

            if (!inMonth) {
              return <div key={i} className={`min-h-[84px] bg-[rgba(0,0,0,.12)] ${borders}`} />;
            }

            const iso         = toISO(new Date(y, m, day));
            const { blocks, unicos: uDay } = eventsOn(iso, events, eventosUnicos);
            const marca       = marks.find((mk) => mk.date === iso);
            const isToday     = iso === today;
            const isCursor    = iso === cursor;
            const frontTypes  = [...new Set([...blocks.map((b) => b.type), ...uDay.map((u) => u.type)])];
            const totalEv     = blocks.length + uDay.length;

            return (
              <div
                key={i}
                onClick={() => { setCursor(iso); setVista("dia"); }}
                className={`min-h-[84px] cursor-pointer p-2.5 transition hover:bg-panel-2 ${borders}`}
              >
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[12px] font-medium ${
                  isToday ? "bg-gold font-bold text-[#1a1208]" :
                  isCursor ? "bg-panel-3 text-foreground" : "text-text-2"
                }`}>
                  {day}
                </span>
                {marca && <div className="mt-0.5 text-[9px] text-warn">📌</div>}
                {frontTypes.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-[3px]">
                    {frontTypes.slice(0, 3).map((ft) => (
                      <span key={ft} className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: FRONT_COLOR[ft] }} />
                    ))}
                    {totalEv > 3 && <span className="text-[9px] leading-none text-text-dim">+{totalEv - 3}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Vista Año ──────────────────────────────────────────────────────────────

  function renderAño() {
    const y    = new Date(cursor + "T00:00:00").getFullYear();
    const curM = new Date(cursor + "T00:00:00").getMonth();

    return (
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, mIdx) => {
          const numDays = new Date(y, mIdx + 1, 0).getDate();
          let   fdow    = new Date(y, mIdx, 1).getDay();
          fdow = fdow === 0 ? 6 : fdow - 1;
          const cells   = Math.ceil((fdow + numDays) / 7) * 7;

          return (
            <div
              key={mIdx}
              className={`overflow-hidden rounded-xl border bg-panel ${curM === mIdx ? "border-gold/40" : "border-line-soft"}`}
            >
              <button
                type="button"
                onClick={() => { setCursor(toISO(new Date(y, mIdx, 1))); setVista("mes"); }}
                className="w-full border-b border-line-soft px-3 py-2 text-left hover:bg-panel-2"
              >
                <span className={`text-[12px] font-semibold ${curM === mIdx ? "text-gold" : "text-text-2"}`}>
                  {MESES_L[mIdx]}
                </span>
              </button>
              <div className="p-2">
                <div className="mb-1 grid grid-cols-7 text-center">
                  {["L","M","X","J","V","S","D"].map((dh) => (
                    <div key={dh} className="text-[7.5px] text-text-dim">{dh}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7">
                  {Array.from({ length: cells }, (_, i) => {
                    const day   = i - fdow + 1;
                    const inM   = day >= 1 && day <= numDays;
                    if (!inM) return <div key={i} className="h-5" />;
                    const iso     = toISO(new Date(y, mIdx, day));
                    const isToday = iso === today;
                    const { blocks, unicos: uDay } = eventsOn(iso, events, eventosUnicos);
                    const frontTypes = [...new Set([...blocks.map((b) => b.type), ...uDay.map((u) => u.type)])];
                    const hasMarca   = marks.some((mk) => mk.date === iso);
                    return (
                      <div
                        key={i}
                        onClick={() => { setCursor(iso); setVista("dia"); }}
                        className="flex h-5 cursor-pointer flex-col items-center justify-center rounded hover:bg-panel-2"
                      >
                        <span className={`text-[9px] leading-none ${isToday ? "font-bold text-gold" : "text-text-2"}`}>
                          {day}
                        </span>
                        {(frontTypes.length > 0 || hasMarca) && (
                          <div className="flex gap-px">
                            {frontTypes.slice(0, 2).map((ft) => (
                              <span key={ft} className="h-[3px] w-[3px] rounded-full" style={{ backgroundColor: FRONT_COLOR[ft] }} />
                            ))}
                            {hasMarca && <span className="h-[3px] w-[3px] rounded-full bg-warn" />}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ── render ────────────────────────────────────────────────────────────────

  const VISTAS: { id: Vista; label: string }[] = [
    { id: "dia",    label: "Día" },
    { id: "semana", label: "Semana" },
    { id: "mes",    label: "Mes" },
    { id: "año",    label: "Año" },
  ];

  return (
    <div className="px-10 py-10">
      {/* Cabecera */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        {/* Selector de vista */}
        <div className="flex overflow-hidden rounded-lg border border-line text-[12px]">
          {VISTAS.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setVista(v.id)}
              className={`px-3 py-1.5 transition ${
                vista === v.id ? "bg-panel-3 text-gold-bright" : "text-text-dim hover:text-text-2"
              } ${i > 0 ? "border-l border-line" : ""}`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Navegación */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => nav(-1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-[18px] leading-none text-text-dim hover:border-gold/40 hover:text-gold-bright"
          >
            ‹
          </button>
          <span className="min-w-[210px] text-center text-[13px] font-medium text-foreground">
            {periodoLabel()}
          </span>
          <button
            type="button"
            onClick={() => nav(1)}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-line text-[18px] leading-none text-text-dim hover:border-gold/40 hover:text-gold-bright"
          >
            ›
          </button>
          <button
            type="button"
            onClick={() => setCursor(todayISO())}
            className="ml-1 rounded-md border border-line px-2.5 py-1 text-[11px] text-text-dim hover:border-gold/40 hover:text-gold-bright"
          >
            Hoy
          </button>
        </div>

        <div className="ml-auto flex gap-2">
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

      {/* Contenido de vista */}
      {vista === "dia"    && renderDia()}
      {vista === "semana" && renderSemana()}
      {vista === "mes"    && renderMes()}
      {vista === "año"    && renderAño()}

      {/* Próximos eventos */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Próximos eventos <span className="h-px flex-1 bg-line" />
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
                <button type="button" onClick={() => run(() => eliminarEventoUnico(ev.id))} className="px-1.5 text-text-dim hover:text-bad">✕</button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Fechas marcadas */}
      <div className="mt-10">
        <div className="mb-4 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
          Fechas marcadas <span className="h-px flex-1 bg-line" />
        </div>
        <div className="flex flex-col gap-2">
          {marks.length === 0 && <p className="text-sm text-text-dim">Sin fechas marcadas.</p>}
          {marks.map((mk) => (
            <div key={mk.id} className="flex items-center gap-3 rounded-lg border border-line-soft bg-panel px-4 py-2.5">
              <span className="font-heading text-sm font-bold text-gold">{fmtDateCorta(mk.date)}</span>
              <span className="flex-1 text-sm text-text-2">{mk.note}</span>
              <button type="button" onClick={() => run(() => desmarcarFecha(mk.id))} className="px-1.5 text-text-dim hover:text-bad">✕</button>
            </div>
          ))}
        </div>
      </div>

      <BloqueModal
        open={modal !== null}
        onClose={() => setModal(null)}
        bloque={editando}
        pending={false}
        onSubmit={(input: BloqueInput) =>
          run(() => (editando ? editarBloque(editando.id, input) : crearBloque(input)), () => setModal(null))
        }
        onDelete={editando ? () => run(() => eliminarBloque(editando.id), () => setModal(null)) : undefined}
      />
      <MarcarFechaModal
        open={marcarOpen}
        onClose={() => setMarcarOpen(false)}
        pending={false}
        onSubmit={(date, note) => run(() => marcarFecha(date, note), () => setMarcarOpen(false))}
      />
    </div>
  );
}
