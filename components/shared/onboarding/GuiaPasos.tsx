"use client";

import { useState } from "react";
import { ONBOARDING_PASOS, FASE_COLOR, type OnboardingFase } from "@/lib/coaching/onboarding-constants";
import type { OnboardingMensajeVM } from "@/lib/coaching/onboarding-queries";

const FASES: OnboardingFase[] = ["D0", "D3", "S1", "MES1"];

const FASE_DIA: Record<OnboardingFase, string> = {
  D0:   "Día 0",
  D3:   "Día 3",
  S1:   "Día 7",
  MES1: "Día 30",
};

const FASE_TITULO: Record<OnboardingFase, string> = {
  D0:   "Bienvenida",
  D3:   "Contacto de control",
  S1:   "Seguimiento preventivo",
  MES1: "Recap",
};

export function GuiaPasos({
  mensajes,
  copiadoEtapa,
  onCopiar,
}: {
  mensajes: OnboardingMensajeVM[];
  copiadoEtapa: string | null;
  onCopiar: (etapa: string, contenido: string) => void;
}) {
  const [abiertas, setAbiertas] = useState<Set<OnboardingFase>>(() => new Set(["D0"]));

  function toggle(fase: OnboardingFase) {
    setAbiertas((prev) => {
      const next = new Set(prev);
      next.has(fase) ? next.delete(fase) : next.add(fase);
      return next;
    });
  }

  return (
    <section>
      <h2 className="mb-1 font-heading text-lg font-bold tracking-wide">Guía de pasos</h2>
      <p className="mb-5 text-sm text-text-dim">
        Checklist de referencia desde que un cliente acepta el servicio hasta que arranca su plan.
      </p>

      <div className="relative flex flex-col gap-5">
        <div className="absolute bottom-4 left-[19px] top-4 w-px bg-line-soft" />

        {FASES.map((fase) => {
          const pasos = ONBOARDING_PASOS.filter((p) => p.fase === fase);
          const color = FASE_COLOR[fase];
          const abierta = abiertas.has(fase);
          const mensaje = mensajes.find((m) => m.etapa === fase);
          const copiado = copiadoEtapa === fase;

          return (
            <div key={fase} className="relative flex gap-4">
              <div
                className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 bg-background text-[10.5px] font-bold"
                style={{ borderColor: color, color }}
              >
                {fase}
              </div>

              <div className="flex-1 overflow-hidden rounded-2xl border border-line-soft bg-panel">
                <button
                  type="button"
                  onClick={() => toggle(fase)}
                  className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-panel-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="font-semibold leading-tight">{FASE_TITULO[fase]}</span>
                      <span className="text-[11px] text-text-dim">{FASE_DIA[fase]}</span>
                    </div>
                    <div className="mt-0.5 text-[11.5px] text-text-dim">{pasos.length} pasos</div>
                  </div>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className={`h-4 w-4 shrink-0 text-text-dim transition-transform ${abierta ? "rotate-90" : ""}`}
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>

                {abierta && (
                  <div className="border-t border-line-soft px-5 pb-5 pt-4">
                    <ul className="flex flex-col gap-2">
                      {pasos.map((paso) => (
                        <li
                          key={paso.orden}
                          className="flex items-start gap-2.5 text-[13px] leading-snug text-text-2"
                        >
                          <span
                            className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          {paso.titulo}
                        </li>
                      ))}
                    </ul>

                    {mensaje && (
                      <button
                        type="button"
                        onClick={() => onCopiar(fase, mensaje.contenido)}
                        className="mt-4 rounded-lg border border-line-soft px-3.5 py-2 text-[12px] font-semibold text-text-2 transition hover:border-gold-dim hover:text-gold-bright"
                      >
                        {copiado ? "✓ Copiado" : "Copiar mensaje"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
