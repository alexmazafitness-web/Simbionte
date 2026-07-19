"use client";

import { useState } from "react";
import {
  fmtSemana,
  RESPUESTAS_VACIAS,
  type DatosAutomaticos,
  type FeedbackIA,
  type HistorialItem,
  type RespuestasUsuario,
  type WeeklyReviewVM,
} from "@/lib/personal/revision";

// ── Metric card ───────────────────────────────────────────────────────────────

function MetricCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "ok" | "warn" | "bad" | "gold";
}) {
  const accentClass = {
    ok: "text-ok",
    warn: "text-warn",
    bad: "text-bad",
    gold: "text-gold",
  }[accent ?? "gold"];
  return (
    <div className="rounded-xl border border-line-soft bg-panel p-4">
      <p className="mb-1 text-[10px] font-bold tracking-[0.18em] text-text-dim uppercase">{label}</p>
      <p className={`font-display text-[28px] leading-none ${accentClass}`}>{value}</p>
      {sub && <p className="mt-1.5 text-[11px] text-text-dim">{sub}</p>}
    </div>
  );
}

// ── Pregunta input ────────────────────────────────────────────────────────────

function Pregunta({
  label,
  hint,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (v: string) => void;
  type?: "text" | "area";
}) {
  return (
    <div>
      <label className="block text-[13px] font-semibold text-foreground">{label}</label>
      <p className="mb-2 text-[11px] text-text-dim">{hint}</p>
      {type === "area" ? (
        <textarea
          rows={2}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full resize-none rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13px] outline-none focus:border-gold-dim"
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13px] outline-none focus:border-gold-dim"
        />
      )}
    </div>
  );
}

// ── Feedback panel ────────────────────────────────────────────────────────────

function FeedbackPanel({ feedback }: { feedback: FeedbackIA }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Resumen */}
      <div className="rounded-xl border border-gold/20 bg-gold/5 p-5">
        <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-gold-dim uppercase">Resumen de la semana</p>
        <p className="text-[14px] leading-relaxed text-foreground">{feedback.resumenEjecutivo}</p>
      </div>

      {/* Palanca clave */}
      {feedback.palancaClave && (
        <div className="rounded-xl border border-gold bg-gold/10 p-5">
          <p className="mb-2 text-[10px] font-bold tracking-[0.2em] text-gold-dim uppercase">
            Palanca clave esta semana
          </p>
          <p className="text-[15px] font-semibold leading-snug text-gold">{feedback.palancaClave}</p>
        </div>
      )}

      {/* Funcionando bien + Foco */}
      <div className="grid grid-cols-2 gap-4">
        {feedback.funcionaBien.length > 0 && (
          <div className="rounded-xl border border-line-soft bg-panel p-4">
            <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-ok uppercase">
              Está funcionando bien
            </p>
            <ul className="flex flex-col gap-2">
              {feedback.funcionaBien.map((item, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-foreground">
                  <span className="mt-[3px] shrink-0 text-ok">✓</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {feedback.focoPrioritario.length > 0 && (
          <div className="rounded-xl border border-line-soft bg-panel p-4">
            <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-warn uppercase">
              Pon más foco aquí
            </p>
            <ul className="flex flex-col gap-2">
              {feedback.focoPrioritario.map((item, i) => (
                <li key={i} className="flex gap-2 text-[12.5px] leading-snug text-foreground">
                  <span className="mt-[3px] shrink-0 text-warn">→</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Tareas recomendadas */}
      {feedback.tareasRecomendadas.length > 0 && (
        <div className="rounded-xl border border-line-soft bg-panel p-4">
          <p className="mb-3 text-[10px] font-bold tracking-[0.2em] text-gold-dim uppercase">
            Tareas recomendadas para la próxima semana
          </p>
          <ol className="flex flex-col gap-2.5">
            {feedback.tareasRecomendadas.map((tarea, i) => (
              <li key={i} className="flex gap-3 text-[13px] leading-snug text-foreground">
                <span className="mt-[1px] shrink-0 font-display text-[16px] leading-tight text-gold-dim">
                  {i + 1}
                </span>
                {tarea}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Pregunta de reflexión */}
      {feedback.preguntaReflexion && (
        <div className="rounded-xl border border-line-soft bg-panel-2 p-5">
          <p className="mb-1.5 text-[10px] font-bold tracking-[0.2em] text-text-dim uppercase">
            Pregunta de reflexión
          </p>
          <p className="text-[14px] italic leading-relaxed text-text-2">
            "{feedback.preguntaReflexion}"
          </p>
        </div>
      )}
    </div>
  );
}

// ── Historial panel ───────────────────────────────────────────────────────────

function HistorialPanel({ items }: { items: HistorialItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-[12px] text-text-dim">
        Todavía no hay revisiones anteriores.
      </p>
    );
  }
  return (
    <div className="divide-y-2 divide-line-soft">
      {items.map((item) => (
        <div key={item.id} className="py-4">
          <p className="mb-1 text-[12px] font-semibold text-foreground">
            {fmtSemana(item.semanaInicio, item.semanaFin)}
          </p>
          <div className="mb-1.5 flex gap-4 text-[11px] text-text-dim">
            <span>MRR: <span className="text-gold">{item.mrrSnapshot}€</span></span>
            <span>Clientes: <span className="text-foreground">{item.clientesActivosSnapshot}</span></span>
            <span>Leads: <span className="text-foreground">{item.leadsActivosSnapshot}</span></span>
          </div>
          {item.resumen && (
            <p className="text-[11.5px] leading-relaxed text-text-dim">{item.resumen}…</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function RevisionPageClient({
  datosAuto,
  revisionActual,
  historial,
  semanaInicio,
  semanaFin,
}: {
  datosAuto: DatosAutomaticos;
  revisionActual: WeeklyReviewVM | null;
  historial: HistorialItem[];
  semanaInicio: string;
  semanaFin: string;
}) {
  const [respuestas, setRespuestas] = useState<RespuestasUsuario>(
    revisionActual?.respuestasUsuario ?? RESPUESTAS_VACIAS,
  );
  const [feedback, setFeedback] = useState<FeedbackIA | null>(
    revisionActual?.feedbackIA ?? null,
  );
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [historialOpen, setHistorialOpen] = useState(false);

  function set(key: keyof RespuestasUsuario, value: string) {
    setRespuestas((r) => ({ ...r, [key]: value }));
  }

  async function generar() {
    setGenerando(true);
    setError("");
    try {
      const res = await fetch("/api/revisiones/semanal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestasUsuario: respuestas }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = (await res.json()) as { feedback: FeedbackIA };
      setFeedback(data.feedback);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido");
    } finally {
      setGenerando(false);
    }
  }

  const hasFeedback = !!feedback;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-line-soft px-8 py-4">
        <div>
          <h1 className="font-heading text-[20px] font-bold">Revisión Semanal</h1>
          <p className="text-[12px] text-text-dim">{fmtSemana(semanaInicio, semanaFin)}</p>
        </div>
        <button
          type="button"
          onClick={() => setHistorialOpen((o) => !o)}
          className={`rounded-lg border px-4 py-1.5 text-[12px] font-semibold transition ${historialOpen ? "border-gold/40 bg-gold/10 text-gold" : "border-line text-text-2 hover:border-gold-dim hover:text-foreground"}`}
        >
          Historial
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 gap-0 overflow-hidden">

        {/* ── Left: main content ─────────────────────────────── */}
        <div className="flex flex-1 flex-col gap-0 overflow-y-auto">
          <div className={`mx-auto w-full px-8 py-6 ${hasFeedback ? "max-w-none" : "max-w-2xl"}`}>

            {/* Metrics */}
            <div className="mb-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
              <MetricCard
                label="MRR"
                value={`${datosAuto.clientes.mrr}€`}
                sub={datosAuto.clientes.nuevosSemana > 0 ? `+${datosAuto.clientes.nuevosSemana} esta semana` : undefined}
                accent="gold"
              />
              <MetricCard
                label="Clientes activos"
                value={datosAuto.clientes.activos}
                sub={datosAuto.clientes.bajasSemana > 0 ? `${datosAuto.clientes.bajasSemana} baja${datosAuto.clientes.bajasSemana > 1 ? "s" : ""}` : undefined}
                accent={datosAuto.clientes.bajasSemana > 0 ? "warn" : "ok"}
              />
              <MetricCard
                label="Tareas completadas"
                value={datosAuto.tareas.completadasSemana}
                sub={`${datosAuto.tareas.pendientesTotales} pendientes`}
                accent={datosAuto.tareas.completadasSemana > 0 ? "ok" : undefined}
              />
              <MetricCard
                label="Leads activos"
                value={datosAuto.leads.total}
                sub={datosAuto.leads.nuevosSemana > 0 ? `+${datosAuto.leads.nuevosSemana} nuevos` : undefined}
              />
              <MetricCard
                label="Revisiones clientes"
                value={datosAuto.revisionesClientes}
                accent={datosAuto.revisionesClientes > 0 ? "ok" : undefined}
              />
              <MetricCard
                label="Notas knowledge"
                value={datosAuto.notasKnowledge}
                accent={datosAuto.notasKnowledge > 0 ? "gold" : undefined}
              />
            </div>

            {/* Leads breakdown */}
            {Object.keys(datosAuto.leads.porEtapa).length > 0 && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                <span className="text-[10.5px] font-bold tracking-[0.15em] text-text-dim uppercase">Pipeline:</span>
                {Object.entries(datosAuto.leads.porEtapa).map(([etapa, count]) => (
                  <span key={etapa} className="rounded-full border border-line-soft bg-panel px-2.5 py-0.5 text-[11px] text-text-2">
                    {etapa} · {count}
                  </span>
                ))}
              </div>
            )}

            {/* Two-col layout once feedback exists */}
            <div className={`flex gap-8 ${hasFeedback ? "items-start" : ""}`}>

              {/* Questions */}
              <div className={hasFeedback ? "w-[360px] shrink-0" : "w-full"}>
                <p className="mb-4 text-[10.5px] font-bold tracking-[0.2em] text-gold-dim uppercase">
                  Tu perspectiva
                </p>
                <div className="flex flex-col gap-4">
                  <Pregunta
                    label="Energía y foco esta semana"
                    hint="Del 1 al 10 — y una frase de por qué"
                    value={respuestas.energia}
                    onChange={(v) => set("energia", v)}
                  />
                  <Pregunta
                    label="¿Publicaste contenido en Instagram?"
                    hint="Qué tipo, cuánto, qué funcionó"
                    value={respuestas.instagram}
                    onChange={(v) => set("instagram", v)}
                    type="area"
                  />
                  <Pregunta
                    label="¿Qué te bloqueó o frenó?"
                    hint="Tiempo, energía, claridad, externo…"
                    value={respuestas.bloqueos}
                    onChange={(v) => set("bloqueos", v)}
                    type="area"
                  />
                  <Pregunta
                    label="Ventas o llamadas de ventas"
                    hint="¿Cerraste algo? ¿Tuviste conversaciones?"
                    value={respuestas.ventas}
                    onChange={(v) => set("ventas", v)}
                    type="area"
                  />
                  <Pregunta
                    label="¿De qué estás más orgulloso?"
                    hint="Lo que más te enorgullece, aunque sea pequeño"
                    value={respuestas.orgullo}
                    onChange={(v) => set("orgullo", v)}
                    type="area"
                  />
                </div>

                <div className="mt-6">
                  {error && <p className="mb-3 text-[12px] text-bad">{error}</p>}
                  <button
                    type="button"
                    onClick={generar}
                    disabled={generando}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-[13.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-50"
                  >
                    {generando ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-[3px] border-[#1a1208]/30 border-t-[#1a1208]" />
                        Analizando con Claude…
                      </>
                    ) : feedback ? (
                      "✦ Regenerar revisión"
                    ) : (
                      "✦ Generar revisión"
                    )}
                  </button>
                  {feedback && (
                    <p className="mt-2 text-center text-[11px] text-text-dim">
                      Guardado automáticamente · puedes regenerar con nuevas respuestas
                    </p>
                  )}
                </div>
              </div>

              {/* Feedback */}
              {feedback && (
                <div className="min-w-0 flex-1">
                  <p className="mb-4 text-[10.5px] font-bold tracking-[0.2em] text-gold-dim uppercase">
                    Análisis IA
                  </p>
                  <FeedbackPanel feedback={feedback} />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* ── Right: historial panel ──────────────────────────── */}
        {historialOpen && (
          <aside className="flex w-72 shrink-0 flex-col border-l border-line-soft">
            <div className="flex items-center justify-between border-b border-line-soft px-5 py-3.5">
              <span className="text-[10px] font-bold tracking-[0.2em] text-gold-dim uppercase">Historial</span>
              <button
                type="button"
                onClick={() => setHistorialOpen(false)}
                className="text-[12px] text-text-dim hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5">
              <HistorialPanel items={historial} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
