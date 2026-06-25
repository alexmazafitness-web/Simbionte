"use client";

import { useState } from "react";
import type { FaseMeta } from "@/lib/coaching/negocio-constants";
import { pctFase, type TarjetaVM } from "@/lib/coaching/negocio";
import { crearTarjeta } from "@/lib/coaching/negocio-actions";
import { TarjetaCard } from "./TarjetaCard";

export function FaseSection({ fase, tarjetas }: { fase: FaseMeta; tarjetas: TarjetaVM[] }) {
  const [nuevaId, setNuevaId] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const pct = pctFase(tarjetas);

  async function handleAdd() {
    setPending(true);
    const { id } = await crearTarjeta(fase.id);
    setNuevaId(id);
    setPending(false);
  }

  return (
    <section className="mb-9">
      <div className="mb-1 flex flex-wrap items-center gap-4">
        <span className="font-display text-[34px] leading-none text-gold-dim">{fase.numero}</span>
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold tracking-wide">{fase.nombre}</h3>
          {fase.esNueva && <span className="rounded border border-[rgba(138,160,184,.4)] bg-[rgba(138,160,184,.08)] px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-[#8AA0B8]">NUEVA</span>}
        </div>
        <div className="ml-auto flex min-w-[130px] items-center gap-2.5">
          <div className="h-[3px] flex-1 overflow-hidden rounded-full bg-panel-3">
            <div className="h-full rounded-full bg-gold" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[12px] text-text-dim">{pct}%</span>
        </div>
      </div>
      <p className="mb-3.5 text-[13.5px] text-text-2">{fase.objetivo}</p>

      <div className="flex flex-col gap-1.5">
        {tarjetas.length === 0 && <p className="py-2 text-[13.5px] text-text-dim italic">Sin tarjetas en esta fase todavía.</p>}
        {tarjetas.map((t) => (
          <TarjetaCard key={t.id} tarjeta={t} recienCreada={t.id === nuevaId} />
        ))}
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={handleAdd}
        className="mt-2.5 w-full rounded-xl border border-dashed border-line py-3 text-[13.5px] font-medium text-text-dim hover:border-gold-dim hover:bg-[rgba(201,169,110,.06)] hover:text-gold-bright disabled:opacity-50"
      >
        + Añadir tarjeta
      </button>
    </section>
  );
}
