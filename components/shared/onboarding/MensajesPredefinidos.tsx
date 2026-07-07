"use client";

import { useState } from "react";
import { FASE_COLOR, FASE_LABEL, type OnboardingFase } from "@/lib/coaching/onboarding-constants";
import type { OnboardingMensajeVM } from "@/lib/coaching/onboarding-queries";
import { actualizarMensajeOnboarding } from "@/lib/coaching/onboarding-actions";

const FASES: OnboardingFase[] = ["D0", "D3", "S1", "MES1"];

// Evita que el mousedown en estos botones dispare el onBlur del textarea
// antes del click — si no, el cambio de layout (textarea -> párrafo) puede
// desplazar el botón entre mousedown y mouseup y perder el click.
function keepFocus(e: React.MouseEvent) {
  e.preventDefault();
}

function MensajeCard({
  mensaje,
  copiado,
  onCopiar,
}: {
  mensaje: OnboardingMensajeVM;
  copiado: boolean;
  onCopiar: (etapa: string, contenido: string) => void;
}) {
  const [texto, setTexto] = useState(mensaje.contenido);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const dirty = texto !== mensaje.contenido;
  const color = FASE_COLOR[mensaje.etapa];

  async function guardar() {
    setGuardando(true);
    try {
      await actualizarMensajeOnboarding(mensaje.etapa, texto);
      setEditando(false);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-line-soft bg-panel p-5">
      <div className="mb-3 flex items-center gap-2.5">
        <span
          className="rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wider"
          style={{ backgroundColor: `${color}22`, color }}
        >
          {mensaje.etapa}
        </span>
        <span className="text-[12.5px] text-text-2">{FASE_LABEL[mensaje.etapa]}</span>
      </div>

      {editando ? (
        <textarea
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onBlur={() => setEditando(false)}
          rows={7}
          className="mb-3 w-full resize-none rounded-lg border border-line-soft bg-panel-2 p-3 text-[13px] leading-relaxed text-text-2 focus:border-gold-dim focus:outline-none"
        />
      ) : (
        <p
          onClick={() => setEditando(true)}
          className="mb-3 min-h-[7lh] cursor-text whitespace-pre-wrap rounded-lg px-3 py-2 text-[13px] leading-relaxed text-text-2 transition hover:bg-panel-2"
        >
          {texto}
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onMouseDown={keepFocus}
          onClick={() => onCopiar(mensaje.etapa, texto)}
          className="rounded-lg border border-line-soft px-3.5 py-2 text-[12px] font-semibold text-text-2 transition hover:border-gold-dim hover:text-gold-bright"
        >
          {copiado ? "✓ Copiado" : "Copiar"}
        </button>
        {dirty && (
          <button
            type="button"
            disabled={guardando}
            onMouseDown={keepFocus}
            onClick={guardar}
            className="rounded-lg bg-gold px-3.5 py-2 text-[12px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-60"
          >
            {guardando ? "Guardando…" : "Guardar"}
          </button>
        )}
      </div>

      <p className="mt-3 text-[11px] text-text-dim">
        [nombre] se reemplaza automáticamente al copiar si hay un cliente seleccionado.
      </p>
    </div>
  );
}

export function MensajesPredefinidos({
  mensajes,
  copiadoEtapa,
  onCopiar,
}: {
  mensajes: OnboardingMensajeVM[];
  copiadoEtapa: string | null;
  onCopiar: (etapa: string, contenido: string) => void;
}) {
  return (
    <section>
      <h2 className="mb-1 font-heading text-lg font-bold tracking-wide">Mensajes predefinidos</h2>
      <p className="mb-5 text-sm text-text-dim">
        Plantillas editables por etapa — los cambios se guardan para todos los próximos clientes.
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {FASES.map((fase) => {
          const mensaje = mensajes.find((m) => m.etapa === fase);
          if (!mensaje) return null;
          return (
            <MensajeCard
              key={fase}
              mensaje={mensaje}
              copiado={copiadoEtapa === fase}
              onCopiar={onCopiar}
            />
          );
        })}
      </div>
    </section>
  );
}
