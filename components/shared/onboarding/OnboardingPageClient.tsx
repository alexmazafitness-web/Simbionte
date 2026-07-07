"use client";

import { useState, useTransition, useOptimistic } from "react";
import type { OnboardingVM, OnboardingPaso, OnboardingMensajeVM } from "@/lib/coaching/onboarding-queries";
import { FASE_LABEL, type OnboardingFase } from "@/lib/coaching/onboarding-constants";
import { marcarPaso } from "@/lib/coaching/onboarding-actions";
import { GuiaPasos } from "./GuiaPasos";
import { MensajesPredefinidos } from "./MensajesPredefinidos";

// ─── Types ────────────────────────────────────────────────────────────────────

type TabValue = "activos" | "completados";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function grupoPorFase(pasos: OnboardingPaso[]): [OnboardingFase, OnboardingPaso[]][] {
  const order: OnboardingFase[] = ["D0", "D3", "S1", "MES1"];
  return order.map((fase) => [fase, pasos.filter((p) => p.fase === fase)]);
}

function faseStatus(
  fase: OnboardingFase,
  pasos: OnboardingPaso[],
  diasDesdeInicio: number,
): "completada" | "activa" | "vencida" | "futura" {
  const offset: Record<OnboardingFase, number> = { D0: 0, D3: 3, S1: 7, MES1: 30 };
  const dias = offset[fase];
  const allDone = pasos.every((p) => p.completado);
  if (allDone) return "completada";
  if (dias > diasDesdeInicio) return "futura";
  // past due: dia_offset has passed but steps remain
  const nextFaseOffset = [3, 7, 30, Infinity][["D0", "D3", "S1", "MES1"].indexOf(fase)];
  if (diasDesdeInicio >= nextFaseOffset) return "vencida";
  return "activa";
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProgressBar({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-panel-3">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#4ade80" : "#C9A96E" }}
        />
      </div>
      <span className="min-w-[48px] text-right text-[11px] text-text-dim tabular-nums">
        {done}/{total}
      </span>
    </div>
  );
}

function FaseHeader({
  fase,
  pasos,
  diasDesdeInicio,
}: {
  fase: OnboardingFase;
  pasos: OnboardingPaso[];
  diasDesdeInicio: number;
}) {
  const status = faseStatus(fase, pasos, diasDesdeInicio);
  const done = pasos.filter((p) => p.completado).length;

  const statusStyles: Record<typeof status, string> = {
    completada: "text-[#4ade80]",
    activa:     "text-[#C9A96E]",
    vencida:    "text-[#f97316]",
    futura:     "text-text-dim",
  };

  const badgeStyles: Record<typeof status, string> = {
    completada: "bg-[#1a3320] text-[#4ade80]",
    activa:     "bg-[#2a1f0e] text-[#C9A96E]",
    vencida:    "bg-[#2a1508] text-[#f97316]",
    futura:     "bg-panel-3 text-text-dim",
  };

  return (
    <div className="flex items-center gap-2.5">
      <span className={`font-heading text-[11px] font-bold tracking-wider ${statusStyles[status]}`}>
        {fase}
      </span>
      <span className="text-[12.5px] text-text-2">{FASE_LABEL[fase]}</span>
      <span className="flex-1" />
      <span className={`rounded px-2 py-0.5 text-[10px] font-semibold ${badgeStyles[status]}`}>
        {done}/{pasos.length}
        {status === "vencida" && " ⚠"}
      </span>
    </div>
  );
}

function OnboardingCard({
  onb,
  expanded,
  onToggleExpand,
}: {
  onb: OnboardingVM;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const [, startTransition] = useTransition();

  const [optimisticPasos, updateOptimistic] = useOptimistic(
    onb.pasos,
    (prev, { pasoId, completado }: { pasoId: string; completado: boolean }) =>
      prev.map((p) => (p.id === pasoId ? { ...p, completado } : p)),
  );

  const optimisticDone = optimisticPasos.filter((p) => p.completado).length;
  const grupos = grupoPorFase(optimisticPasos);

  function handleCheck(paso: OnboardingPaso) {
    const next = !paso.completado;
    updateOptimistic({ pasoId: paso.id, completado: next });
    startTransition(() => {
      void marcarPaso(paso.id, onb.id, next);
    });
  }

  const iniciales = onb.clienteNombre
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div className="overflow-hidden rounded-2xl border border-line-soft bg-panel">
      {/* Card header — always visible */}
      <button
        type="button"
        onClick={onToggleExpand}
        className="flex w-full items-center gap-3.5 px-5 py-4 text-left transition hover:bg-panel-2"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-panel-3 font-heading text-[13px] font-bold text-gold">
          {iniciales}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <span className="font-semibold leading-tight">{onb.clienteNombre}</span>
            <span className="text-[11px] text-text-dim">D+{onb.diasDesdeInicio}</span>
          </div>
          <div className="mt-1.5">
            <ProgressBar done={optimisticDone} total={onb.totalPasos} />
          </div>
        </div>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={`h-4 w-4 shrink-0 text-text-dim transition-transform ${expanded ? "rotate-90" : ""}`}
        >
          <path d="M9 6l6 6-6 6" />
        </svg>
      </button>

      {/* Expanded checklist */}
      {expanded && (
        <div className="border-t border-line-soft px-5 pb-5 pt-4">
          {grupos.map(([fase, pasos]) => {
            if (pasos.length === 0) return null;
            return (
              <div key={fase} className="mb-4 last:mb-0">
                <div className="mb-2">
                  <FaseHeader
                    fase={fase}
                    pasos={pasos}
                    diasDesdeInicio={onb.diasDesdeInicio}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  {pasos.map((paso) => (
                    <label
                      key={paso.id}
                      className="flex cursor-pointer items-start gap-2.5 rounded-lg px-3 py-2 transition hover:bg-panel-2"
                    >
                      <input
                        type="checkbox"
                        checked={paso.completado}
                        onChange={() => handleCheck(paso)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-[#C9A96E]"
                      />
                      <span
                        className={`text-[13px] leading-snug ${paso.completado ? "text-text-dim line-through" : "text-text-2"}`}
                      >
                        {paso.titulo}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function OnboardingPageClient({
  activos,
  completados,
  mensajes,
}: {
  activos:    OnboardingVM[];
  completados: OnboardingVM[];
  mensajes:   OnboardingMensajeVM[];
}) {
  const [tab, setTab] = useState<TabValue>("activos");
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    // Auto-expand if only one active client
    if (activos.length === 1) return new Set([activos[0].id]);
    return new Set();
  });
  const [clienteId, setClienteId] = useState("");
  const [copiadoEtapa, setCopiadoEtapa] = useState<string | null>(null);

  const clienteNombre = activos.find((a) => a.clienteId === clienteId)?.clienteNombre ?? null;

  function copiar(etapa: string, contenido: string) {
    const texto = clienteNombre ? contenido.replaceAll("[nombre]", clienteNombre) : contenido;
    void navigator.clipboard.writeText(texto);
    setCopiadoEtapa(etapa);
    setTimeout(() => setCopiadoEtapa((prev) => (prev === etapa ? null : prev)), 1500);
  }

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  const list = tab === "activos" ? activos : completados;

  return (
    <div className="flex flex-col gap-10">
      {/* Selector de cliente — alimenta la sustitución de [nombre] al copiar */}
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="cliente-onboarding" className="text-[11px] uppercase tracking-wider text-text-dim">
          Cliente para personalizar mensajes
        </label>
        <select
          id="cliente-onboarding"
          value={clienteId}
          onChange={(e) => setClienteId(e.target.value)}
          className="rounded-lg border border-line-soft bg-panel-2 px-3 py-2 text-[12.5px] text-text-2 focus:border-gold-dim focus:outline-none"
        >
          <option value="">Sin seleccionar</option>
          {activos.map((a) => (
            <option key={a.clienteId} value={a.clienteId}>
              {a.clienteNombre}
            </option>
          ))}
        </select>
      </div>

      <GuiaPasos mensajes={mensajes} copiadoEtapa={copiadoEtapa} onCopiar={copiar} />

      <MensajesPredefinidos mensajes={mensajes} copiadoEtapa={copiadoEtapa} onCopiar={copiar} />

      <div>
      <h2 className="mb-1 font-heading text-lg font-bold tracking-wide">Seguimiento por cliente</h2>
      <p className="mb-5 text-sm text-text-dim">
        Progreso real del onboarding de cada cliente en curso.
      </p>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-xl bg-panel-2 p-1 w-fit">
        {(["activos", "completados"] as TabValue[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-[12.5px] font-semibold capitalize transition ${
              tab === t
                ? "bg-panel text-foreground shadow-sm"
                : "text-text-dim hover:text-text-2"
            }`}
          >
            {t === "activos" ? `En progreso (${activos.length})` : `Completados (${completados.length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {list.length === 0 ? (
        <div className="rounded-2xl border border-line-soft bg-panel px-8 py-14 text-center">
          <div className="text-2xl">
            {tab === "activos" ? "✓" : "—"}
          </div>
          <div className="mt-3 text-sm text-text-dim">
            {tab === "activos"
              ? "Sin clientes en proceso de onboarding"
              : "Aún no hay onboardings completados"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {list.map((onb) => (
            <OnboardingCard
              key={onb.id}
              onb={onb}
              expanded={expanded.has(onb.id)}
              onToggleExpand={() => toggleExpand(onb.id)}
            />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
