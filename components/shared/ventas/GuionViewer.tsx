"use client";

import { useState } from "react";
import { FASES_LLAMADA } from "@/lib/coaching/ventas-constants";

export function GuionViewer() {
  const [idx, setIdx] = useState(0);
  const [abiertas, setAbiertas] = useState<Set<number>>(new Set([0]));
  const fase = FASES_LLAMADA[idx];
  const total = FASES_LLAMADA.length;

  function toggleObjecion(i: number) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="grid grid-cols-[230px_1fr] gap-6 rounded-2xl border border-line-soft bg-panel p-0 overflow-hidden">
      <div className="border-r border-line-soft p-4">
        <nav className="flex flex-col gap-0.5">
          {FASES_LLAMADA.map((f, i) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setIdx(i)}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] transition ${
                i === idx ? "bg-[rgba(201,169,110,.14)] text-gold-bright" : "text-text-2 hover:bg-panel-2"
              }`}
            >
              <span
                className={`flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[10px] font-bold ${
                  i === idx ? "border-gold bg-gold text-[#1a1208]" : "border-current"
                }`}
              >
                {f.numero}
              </span>
              <span className="flex-1 font-medium">{f.nombre}</span>
              {f.tiempo && <span className="text-[10px] text-text-dim">{f.tiempo}</span>}
            </button>
          ))}
        </nav>
        <div className="mt-4 border-t border-line-soft pt-3">
          <div className="mb-1 text-[11px] text-text-dim">
            Fase {idx + 1} de {total}
          </div>
          <div className="h-[3px] overflow-hidden rounded-full bg-panel-3">
            <div className="h-full rounded-full bg-gold" style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl p-7">
        <div className="mb-1 text-[10px] font-bold tracking-[0.12em] text-gold uppercase">{fase.eyebrow}</div>
        <h2 className="mb-1 text-2xl font-bold">{fase.nombre}</h2>
        <p className="mb-5 text-[13px] text-text-dim">{fase.meta}</p>

        {fase.alerta && (
          <div className="mb-5 rounded-lg border border-bad/20 bg-bad-bg p-4">
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-bad uppercase">{fase.alerta.titulo}</div>
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-bad">{fase.alerta.texto}</p>
          </div>
        )}

        {fase.badges && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {fase.badges.map((b) => (
              <span
                key={b.texto}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${b.variante === "ok" ? "bg-ok-bg text-ok" : "bg-warn-bg text-warn"}`}
              >
                {b.texto}
              </span>
            ))}
          </div>
        )}

        {fase.leadCard && (
          <div className="mb-5 grid grid-cols-2 gap-3.5 rounded-lg border border-line-soft bg-panel-2 p-4">
            {fase.leadCard.map((c) => (
              <div key={c.label}>
                <div className="text-[10px] font-bold tracking-wide text-text-dim uppercase">{c.label}</div>
                <div className="text-sm">{c.valor}</div>
              </div>
            ))}
          </div>
        )}

        {fase.objetivoPsicologico && (
          <div className="mb-5 rounded-lg border border-gold-dim bg-[rgba(201,169,110,.08)] p-4">
            <div className="mb-1 text-[10px] font-bold tracking-wide text-gold uppercase">Objetivo psicológico</div>
            <p className="text-[13px] leading-relaxed text-gold-bright">{fase.objetivoPsicologico}</p>
          </div>
        )}

        {fase.diagnostico && (
          <div className="mb-5 rounded-lg border border-gold-dim bg-[rgba(201,169,110,.08)] p-4">
            <div className="mb-3 text-[10px] font-bold tracking-wide text-gold uppercase">Diagnóstico previo</div>
            <div className="grid grid-cols-2 gap-3">
              {fase.diagnostico.map((d) => (
                <div key={d.label} className={d.destacado ? "col-span-2" : ""}>
                  <div className="mb-0.5 text-[11px] text-text-dim">{d.label}</div>
                  {d.destacado ? (
                    <p className="rounded border-l-2 border-gold bg-[rgba(201,169,110,.1)] px-3 py-2 text-[13px] italic text-gold-bright">{d.texto}</p>
                  ) : (
                    <p className="text-[13px] leading-relaxed text-gold-bright">{d.texto}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {fase.bloques.length > 0 && (
          <div className="mb-5">
            <div className="mb-2.5 text-[10px] font-bold tracking-wide text-text-dim uppercase">Guion</div>
            <div className="flex flex-col gap-2">
              {fase.bloques.map((b, i) => (
                <div key={i} className={`rounded-lg p-4 ${b.destacado ? "border border-gold-dim bg-panel-2" : "bg-panel-2"}`}>
                  {b.titulo && <div className="mb-1.5 text-[10px] font-bold tracking-wide text-gold uppercase">{b.titulo}</div>}
                  <p className="text-sm leading-relaxed whitespace-pre-line">{b.texto}</p>
                  {b.nota && <p className="mt-2 border-t border-line-soft pt-2 text-[12px] text-text-dim italic">{b.nota}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        {fase.advertencia && (
          <div className="mb-5 rounded-lg border border-warn/20 bg-warn-bg p-4">
            <div className="mb-1.5 text-[10px] font-bold tracking-wide text-warn uppercase">{fase.advertencia.titulo}</div>
            <p className="text-[13px] leading-relaxed text-warn">{fase.advertencia.texto}</p>
          </div>
        )}

        {fase.objeciones && (
          <div className="mb-5 flex flex-col gap-2">
            {fase.objeciones.map((o, i) => {
              const abierta = abiertas.has(i);
              return (
                <div key={o.titulo} className="overflow-hidden rounded-lg border border-line-soft">
                  <button type="button" onClick={() => toggleObjecion(i)} className="flex w-full items-center justify-between gap-2.5 bg-panel-2 px-4 py-3 text-left hover:bg-panel-3">
                    <span className="text-sm font-medium">{o.titulo}</span>
                    <span className="rounded-full bg-panel-3 px-2 py-0.5 text-[11px] text-text-dim">{o.tag}</span>
                  </button>
                  {abierta && (
                    <div className="border-t border-line-soft bg-panel-2 p-4">
                      <p className="mb-3 rounded bg-panel-3 px-3 py-2 text-[12px] leading-relaxed text-text-dim">{o.lectura}</p>
                      <div className="rounded-lg border border-gold-dim bg-panel p-3.5">
                        <div className="mb-1.5 text-[10px] font-bold tracking-wide text-gold uppercase">TÚ</div>
                        <p className="text-sm leading-relaxed">{o.respuesta}</p>
                      </div>
                      {o.notaRespuesta && <p className="mt-2 text-[12px] text-text-dim italic">{o.notaRespuesta}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {fase.notasEstrategicas && (
          <div className="rounded-lg bg-panel-2 p-4">
            <div className="mb-2.5 text-[10px] font-bold tracking-wide text-text-dim uppercase">Notas estratégicas</div>
            <ul className="flex flex-col gap-1.5">
              {fase.notasEstrategicas.map((n) => (
                <li key={n} className="flex gap-2 text-[13px] leading-relaxed text-text-2">
                  <span className="text-gold">→</span>
                  {n}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-7 flex items-center justify-between border-t border-line-soft pt-5">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            className="rounded-lg border border-line px-4 py-2 text-[13px] text-text-2 disabled:opacity-20"
          >
            ← Anterior
          </button>
          <span className="text-[12px] text-text-dim">
            Fase {idx + 1} de {total}
          </span>
          <button
            type="button"
            disabled={idx === total - 1}
            onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}
            className="rounded-lg bg-gold px-4 py-2 text-[13px] font-semibold text-[#1a1208] disabled:opacity-20"
          >
            Siguiente →
          </button>
        </div>
      </div>
    </div>
  );
}
