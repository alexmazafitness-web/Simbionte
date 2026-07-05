"use client";

import { useState, useTransition } from "react";
import {
  OBJETIVO_LIST, OBJETIVO_LABEL, EXPERIENCIA_LIST, EXPERIENCIA_LABEL, DATOS_MANUALES_VACIOS,
  type DatosManualesLead, type LeadContextoVM, type ScriptGenerado,
} from "@/lib/coaching/lead-contexto";
import { guardarContextoYScript } from "@/lib/coaching/lead-contexto-actions";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim";

function parseScript(raw: string | null): ScriptGenerado | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ScriptGenerado;
  } catch {
    return null;
  }
}

// Renderiza **frases clave** en negrita dorada sin depender de una librería
// de markdown — el prompt de IA solo usa este único marcador.
function conFrasesClave(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**")
      ? <strong key={i} className="font-semibold text-gold-bright">{parte.slice(2, -2)}</strong>
      : <span key={i}>{parte}</span>,
  );
}

export function PrepararLlamada({ leadId, contexto }: { leadId: string; contexto: LeadContextoVM | null }) {
  const [modo, setModo] = useState<"cuestionario" | "manual">(
    contexto?.datosManuales && !contexto.respuestasCuestionario ? "manual" : "cuestionario",
  );
  const [cuestionario, setCuestionario] = useState(contexto?.respuestasCuestionario ?? "");
  const [datos, setDatos] = useState<DatosManualesLead>(contexto?.datosManuales ?? DATOS_MANUALES_VACIOS);
  const [script, setScript] = useState<ScriptGenerado | null>(parseScript(contexto?.scriptGenerado ?? null));
  const [generando, setGenerando] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [, startTransition] = useTransition();

  const tieneEntrada = modo === "cuestionario" ? cuestionario.trim().length > 0 : datos.nombre.trim().length > 0;

  async function generarScript() {
    setGenerando(true);
    setErrorMsg("");
    try {
      const body = modo === "cuestionario"
        ? { respuestasCuestionario: cuestionario }
        : { datosManuales: datos };
      const res = await fetch("/api/ventas/generar-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Error ${res.status}`);
      }
      const generado = await res.json() as ScriptGenerado;
      setScript(generado);
      startTransition(async () => {
        await guardarContextoYScript(leadId, {
          respuestasCuestionario: modo === "cuestionario" ? cuestionario : (contexto?.respuestasCuestionario ?? ""),
          datosManuales: modo === "manual" ? datos : (contexto?.datosManuales ?? null),
          scriptGenerado: JSON.stringify(generado),
        });
      });
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error generando el script");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="mt-6 border-t border-line-soft pt-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-[10px] font-bold tracking-[0.2em] text-gold-dim uppercase">📞 Preparar llamada</span>
        {contexto?.scriptGeneradoAt && (
          <span className="text-[10.5px] text-text-dim">
            · generado el {new Date(contexto.scriptGeneradoAt).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
          </span>
        )}
      </div>

      {/* Selector de modo */}
      <div className="mb-3 flex gap-1.5">
        <button
          type="button"
          onClick={() => setModo("cuestionario")}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${modo === "cuestionario" ? "bg-gold/12 text-gold-bright" : "bg-panel-2 text-text-dim hover:text-foreground"}`}
        >
          Cuestionario
        </button>
        <button
          type="button"
          onClick={() => setModo("manual")}
          className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition ${modo === "manual" ? "bg-gold/12 text-gold-bright" : "bg-panel-2 text-text-dim hover:text-foreground"}`}
        >
          Datos manuales
        </button>
      </div>

      {modo === "cuestionario" ? (
        <textarea
          rows={6}
          value={cuestionario}
          onChange={(e) => setCuestionario(e.target.value)}
          placeholder="Pega aquí las respuestas del cuestionario (Typeform o similar)…"
          className={`${inputClass} resize-none leading-relaxed`}
        />
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Nombre</label>
            <input className={inputClass} value={datos.nombre} onChange={(e) => setDatos((d) => ({ ...d, nombre: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Edad</label>
            <input className={inputClass} value={datos.edad} onChange={(e) => setDatos((d) => ({ ...d, edad: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Objetivo principal</label>
            <select className={inputClass} value={datos.objetivo} onChange={(e) => setDatos((d) => ({ ...d, objetivo: e.target.value as DatosManualesLead["objetivo"] }))}>
              <option value="">Sin especificar</option>
              {OBJETIVO_LIST.map((o) => <option key={o} value={o}>{OBJETIVO_LABEL[o]}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Experiencia entrenando</label>
            <select className={inputClass} value={datos.experiencia} onChange={(e) => setDatos((d) => ({ ...d, experiencia: e.target.value as DatosManualesLead["experiencia"] }))}>
              <option value="">Sin especificar</option>
              {EXPERIENCIA_LIST.map((x) => <option key={x} value={x}>{EXPERIENCIA_LABEL[x]}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Disponibilidad semanal para entrenar</label>
            <input className={inputClass} value={datos.disponibilidad} onChange={(e) => setDatos((d) => ({ ...d, disponibilidad: e.target.value }))} placeholder="Ej: 4 días, mañanas" />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Principal obstáculo hasta ahora</label>
            <input className={inputClass} value={datos.obstaculo} onChange={(e) => setDatos((d) => ({ ...d, obstaculo: e.target.value }))} placeholder="Ej: falta de constancia, no sabe qué comer…" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">¿Ha tenido coach antes?</label>
            <select
              className={inputClass}
              value={datos.tuvoCoach === null ? "" : datos.tuvoCoach ? "si" : "no"}
              onChange={(e) => setDatos((d) => ({ ...d, tuvoCoach: e.target.value === "" ? null : e.target.value === "si" }))}
            >
              <option value="">Sin especificar</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Motivación principal</label>
            <input className={inputClass} value={datos.motivacion} onChange={(e) => setDatos((d) => ({ ...d, motivacion: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">
              Situación económica percibida <span className="normal-case font-normal text-text-dim">— no preguntar directamente, solo notas</span>
            </label>
            <input className={inputClass} value={datos.notasEconomicas} onChange={(e) => setDatos((d) => ({ ...d, notasEconomicas: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="mb-1 block text-[10px] tracking-wide text-text-dim uppercase">Otra info relevante</label>
            <textarea rows={2} className={`${inputClass} resize-none`} value={datos.otros} onChange={(e) => setDatos((d) => ({ ...d, otros: e.target.value }))} />
          </div>
        </div>
      )}

      {errorMsg && <p className="mt-2 text-[12px] text-bad">{errorMsg}</p>}

      <button
        type="button"
        disabled={generando || !tieneEntrada}
        onClick={generarScript}
        className="mt-3 flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
      >
        {generando ? "Generando…" : script ? "↻ Regenerar script" : "✨ Generar script"}
      </button>

      {/* Script generado */}
      {script && (
        <div className="mt-5 flex flex-col gap-3">
          {script.fases.map((fase, i) => (
            <div key={i} className="rounded-xl border border-line-soft bg-panel-2 p-4">
              <div className="mb-1.5 text-[12px] font-bold tracking-wide text-gold-dim uppercase">{fase.titulo}</div>
              <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap text-text-2">{conFrasesClave(fase.contenido)}</p>
            </div>
          ))}

          <div className="rounded-xl border border-gold-dim bg-panel p-4">
            <div className="mb-2 text-[12px] font-bold tracking-wide text-gold-dim uppercase">Resumen — puntos de dolor</div>
            <ul className="mb-4 space-y-1.5">
              {script.resumenFinal.puntosDolor.map((p, i) => (
                <li key={i} className="flex gap-2 text-[13px] leading-relaxed text-text-2">
                  <span className="mt-0.5 shrink-0 text-gold-dim">•</span><span>{p}</span>
                </li>
              ))}
            </ul>
            <div className="mb-2 text-[12px] font-bold tracking-wide text-gold-dim uppercase">Objeciones y cómo rebatirlas</div>
            <div className="flex flex-col gap-3">
              {script.resumenFinal.objeciones.map((o, i) => (
                <div key={i}>
                  <div className="text-[13px] font-semibold text-foreground">&ldquo;{o.objecion}&rdquo;</div>
                  <div className="mt-1 text-[13px] leading-relaxed text-text-2">{conFrasesClave(o.respuesta)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
