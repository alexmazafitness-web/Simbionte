"use client";

import { useState } from "react";
import { FASES, PRIORIDADES, TRACKS, type EstadoTarjeta, type TrackId } from "@/lib/coaching/negocio-constants";
import { estadoEfectivo, type TarjetaVM } from "@/lib/coaching/negocio";
import { FaseSection } from "./FaseSection";

type Filtro = "todos" | EstadoTarjeta;

export function NegocioPageClient({ tarjetas }: { tarjetas: TarjetaVM[] }) {
  const [track, setTrack] = useState<TrackId>("ciclo");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const fasesTrack = FASES.filter((f) => f.track === track);
  const itemsTrack = tarjetas.filter((t) => fasesTrack.some((f) => f.id === t.faseId));

  const conteo: Record<Filtro, number> = { todos: itemsTrack.length, pendiente: 0, curso: 0, hecho: 0 };
  itemsTrack.forEach((t) => {
    const e = estadoEfectivo(t);
    if (e !== "nodef") conteo[e]++;
  });

  function tarjetasDeFase(faseId: string) {
    const todas = tarjetas.filter((t) => t.faseId === faseId);
    if (filtro === "todos") return todas;
    return todas.filter((t) => estadoEfectivo(t) === filtro);
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 grid grid-cols-2 gap-2.5">
        {TRACKS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTrack(t.id)}
            className={`rounded-xl border p-3.5 text-left transition ${
              track === t.id ? "border-gold bg-[rgba(201,169,110,.1)]" : "border-line-soft bg-panel-2 hover:border-line"
            }`}
          >
            <div className={`text-[12.5px] font-extrabold tracking-wide uppercase ${track === t.id ? "text-gold" : "text-text-2"}`}>{t.modulo}</div>
            <div className={`mt-0.5 text-[11px] ${track === t.id ? "text-text-2" : "text-text-dim"}`}>{t.nombre}</div>
          </button>
        ))}
      </div>

      <div className="mb-7 flex flex-wrap gap-1.5">
        {(["todos", "pendiente", "curso", "hecho"] as Filtro[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition ${
              filtro === f ? "border-gold bg-gold font-semibold text-[#13110C]" : "border-line-soft text-text-2 hover:border-line"
            }`}
          >
            {f === "todos" ? "Todos" : f === "pendiente" ? "Pendiente" : f === "curso" ? "En curso" : "Hecho"} <span className="opacity-70">{conteo[f]}</span>
          </button>
        ))}
      </div>

      {fasesTrack.map((fase) => (
        <FaseSection key={fase.id} fase={fase} tarjetas={tarjetasDeFase(fase.id)} />
      ))}

      <section className="mt-10 border-t border-line pt-8">
        <h2 className="mb-1.5 text-[13px] font-semibold tracking-[0.22em] text-gold uppercase">Hoja de ruta priorizada</h2>
        <p className="mb-6 max-w-xl text-[14px] text-text-2">
          El cierre ya está resuelto. El cuello de botella es el volumen y la entrega aún no manualizada. Por eso el orden importa.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {PRIORIDADES.map((p) => (
            <div key={p.rango} className="relative overflow-hidden rounded-2xl border border-line-soft bg-panel-2 p-4">
              <span className="absolute top-0 bottom-0 left-0 w-0.5 bg-gold opacity-50" />
              <div className="text-[11px] font-bold tracking-wide text-gold">{p.rango}</div>
              <h3 className="my-1.5 text-base font-semibold">{p.titulo}</h3>
              <p className="text-[13px] leading-snug text-text-2">{p.texto}</p>
              <span className="mt-2.5 inline-block rounded-md border border-line-soft px-2 py-0.5 text-[11px] text-text-dim">{p.cuando}</span>
            </div>
          ))}
        </div>
        <p className="mt-5 text-[13.5px] text-text-2">
          <b className="font-semibold text-gold">Regla de oro:</b> estandarizar → automatizar → medir → escalar. Operaciones avanza en paralelo a todo lo anterior, no después.
        </p>
      </section>
    </div>
  );
}
