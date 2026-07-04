"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import type { KnCategoryVM, FuenteTipo, SesionPausadaVM } from "@/lib/personal/knowledge";
import { FUENTE_LIST } from "@/lib/personal/knowledge";
import {
  crearNotaIA,
  crearSesionNota,
  eliminarSesionNota,
  limpiarSesionNotas,
  guardarSesionYSalir,
} from "@/lib/personal/knowledge-actions";

type Step = "activa" | "procesando" | "preview";

type SesionNota = {
  id: string;
  contenido: string;
  ts: Date;
};

function fmtTime(d: Date) {
  return d.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function SesionModo({
  categorias,
  defaultCategoriaId,
  resumeFrom,
  onGuardada,
  onCerrar,
}: {
  categorias: KnCategoryVM[];
  defaultCategoriaId: string | null;
  resumeFrom?: SesionPausadaVM | null;
  onGuardada: () => void;
  onCerrar: () => void;
}) {
  const sesionId = useRef(resumeFrom?.sesionId ?? crypto.randomUUID());

  const [step, setStep]             = useState<Step>("activa");
  const [notas, setNotas]           = useState<SesionNota[]>(() =>
    (resumeFrom?.notas ?? []).map((n) => ({ id: n.id, contenido: n.contenido, ts: new Date(n.createdAt) })),
  );
  const [draft, setDraft]           = useState("");
  const [fuenteTipo, setFuenteTipo] = useState<FuenteTipo>(resumeFrom?.fuenteTipo ?? "podcast");
  const [fuenteNombre, setFuenteNombre] = useState(resumeFrom?.fuenteNombre ?? "");
  const [url, setUrl]                   = useState(resumeFrom?.url ?? "");
  const [categoriaId, setCategoriaId]   = useState<string | null>(resumeFrom?.categoriaId ?? defaultCategoriaId);
  const [errorMsg, setErrorMsg]         = useState("");

  const [titulo,        setTitulo]        = useState("");
  const [contenido,     setContenido]     = useState("");
  const [puntosText,    setPuntosText]    = useState("");
  const [categoriaPrev, setCategoriaPrev] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const notasEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (notas.length > 0) {
      notasEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [notas.length]);

  function addNota() {
    if (!draft.trim()) return;
    const id = crypto.randomUUID();
    const nota: SesionNota = { id, contenido: draft.trim(), ts: new Date() };
    setNotas((prev) => [...prev, nota]);
    setDraft("");
    textareaRef.current?.focus();
    void crearSesionNota(id, sesionId.current, nota.contenido, notas.length);
  }

  function removeNota(id: string) {
    setNotas((prev) => prev.filter((n) => n.id !== id));
    void eliminarSesionNota(id);
  }

  function cerrarSinGuardar() {
    void limpiarSesionNotas(sesionId.current);
    onCerrar();
  }

  function guardarYSalir() {
    startTransition(async () => {
      await guardarSesionYSalir(sesionId.current, { fuenteTipo, fuenteNombre, url, categoriaId });
      onCerrar();
    });
  }

  async function procesarSesion() {
    if (notas.length === 0) return;
    setStep("procesando");
    setErrorMsg("");
    try {
      const res = await fetch("/api/knowledge/procesar-sesion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notas: notas.map((n) => n.contenido),
          fuenteTipo,
          fuenteNombre,
          categorias: categorias.map((c) => ({ id: c.id, name: c.name })),
          categoriaId,
        }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`);
      const data = await res.json() as {
        titulo: string;
        contenido: string;
        puntosClave: string[];
        categoriaId: string | null;
      };
      setTitulo(data.titulo ?? "");
      setContenido(data.contenido ?? "");
      setPuntosText((data.puntosClave ?? []).join("\n"));
      setCategoriaPrev(data.categoriaId ?? categoriaId);
      setStep("preview");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error desconocido");
      setStep("activa");
    }
  }

  function guardar() {
    const puntosClave = puntosText.split("\n").map((l) => l.trim()).filter(Boolean);
    startTransition(async () => {
      await crearNotaIA({
        title:            titulo,
        contentProcesado: contenido,
        notaBruta:        "",
        fuenteTipo,
        fuenteNombre,
        url,
        puntosClave,
        categoryId:       categoriaPrev,
        fuenteLongitud:   "sesion",
      });
      void limpiarSesionNotas(sesionId.current);
      onGuardada();
    });
  }

  // ── Procesando ─────────────────────────────────────────────────────────────

  if (step === "procesando") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-5 bg-[#0f0f0f]">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-line border-t-gold" />
        <p className="text-[13px] text-text-dim">
          Claude está integrando {notas.length} nota{notas.length !== 1 ? "s" : ""} de la sesión…
        </p>
      </div>
    );
  }

  // ── Preview ────────────────────────────────────────────────────────────────

  if (step === "preview") {
    return (
      <div className="flex h-full flex-col overflow-y-auto bg-[#0f0f0f]">
        <div className="flex items-center justify-between border-b border-line-soft px-6 py-3.5">
          <span className="text-[10.5px] font-bold tracking-[0.2em] text-ok uppercase">
            Resultado de la sesión
          </span>
          <button
            type="button"
            onClick={() => setStep("activa")}
            className="text-[12px] text-text-dim hover:text-foreground"
          >
            ← Volver a la sesión
          </button>
        </div>
        <div className="flex flex-col gap-4 p-8">
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              Título
            </label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[14px] font-semibold outline-none focus:border-gold-dim"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              Conocimiento integrado
            </label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={14}
              className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] leading-relaxed outline-none focus:border-gold-dim"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              Puntos clave{" "}
              <span className="normal-case font-normal tracking-normal text-text-dim">
                — un punto por línea
              </span>
            </label>
            <textarea
              value={puntosText}
              onChange={(e) => setPuntosText(e.target.value)}
              rows={8}
              className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] outline-none focus:border-gold-dim"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              Categoría
            </label>
            <select
              value={categoriaPrev ?? ""}
              onChange={(e) => setCategoriaPrev(e.target.value || null)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center justify-end pb-6 pt-2">
            <button
              type="button"
              onClick={guardar}
              disabled={!titulo.trim()}
              className="rounded-lg bg-gold px-6 py-2.5 text-[13px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            >
              Guardar nota
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Sesión activa ──────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0f0f0f]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-soft px-6 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-ok" />
          <span className="text-[10.5px] font-bold tracking-[0.2em] text-ok uppercase">
            Sesión activa
          </span>
          {notas.length > 0 && (
            <span className="text-[11px] text-text-dim">
              · {notas.length} nota{notas.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={guardarYSalir}
            disabled={notas.length === 0}
            className="text-[12px] text-text-dim hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:text-text-dim"
          >
            Guardar y salir
          </button>
          <button
            type="button"
            onClick={cerrarSinGuardar}
            className="text-[12px] text-text-dim hover:text-foreground"
          >
            Cerrar sin guardar
          </button>
        </div>
      </div>

      {/* Source config */}
      <div className="grid grid-cols-4 gap-3 border-b border-line-soft px-6 py-3.5">
        <div>
          <label className="mb-1 block text-[10px] font-semibold tracking-[0.18em] text-text-dim uppercase">
            Fuente
          </label>
          <select
            value={fuenteTipo}
            onChange={(e) => setFuenteTipo(e.target.value as FuenteTipo)}
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim"
          >
            {FUENTE_LIST.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold tracking-[0.18em] text-text-dim uppercase">
            Nombre
          </label>
          <input
            value={fuenteNombre}
            onChange={(e) => setFuenteNombre(e.target.value)}
            placeholder="Ej: Huberman Lab — Ep. 42"
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim placeholder:text-text-dim"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold tracking-[0.18em] text-text-dim uppercase">
            Link
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enlace del podcast, vídeo, artículo…"
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim placeholder:text-text-dim"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold tracking-[0.18em] text-text-dim uppercase">
            Categoría
          </label>
          <select
            value={categoriaId ?? ""}
            onChange={(e) => setCategoriaId(e.target.value || null)}
            className="w-full rounded-lg border border-line bg-panel-2 px-3 py-1.5 text-[12.5px] outline-none focus:border-gold-dim"
          >
            <option value="">Sin categoría</option>
            {categorias.map((c) => (
              <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Notes list */}
      <div className="flex-1 overflow-y-auto px-6 py-2">
        {notas.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-[13px] text-text-dim">Añade tu primera nota abajo</p>
          </div>
        ) : (
          <div className="divide-y divide-line-soft">
            {notas.map((n, i) => (
              <div key={n.id} className="group flex items-start gap-4 py-3.5">
                <span className="mt-0.5 shrink-0 font-display text-[16px] leading-tight text-gold-dim">
                  {i + 1}
                </span>
                <p className="flex-1 text-[13.5px] leading-relaxed text-foreground">
                  {n.contenido}
                </p>
                <span className="shrink-0 tabular-nums text-[10.5px] text-text-dim">
                  {fmtTime(n.ts)}
                </span>
                <button
                  type="button"
                  onClick={() => removeNota(n.id)}
                  className="shrink-0 text-[11px] text-text-dim opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
                  title="Eliminar nota"
                >
                  ✕
                </button>
              </div>
            ))}
            <div ref={notasEndRef} />
          </div>
        )}
      </div>

      {/* Input — protagonist */}
      <div className="border-t border-line-soft bg-[#0d0d0d] px-6 py-5">
        {errorMsg && (
          <p className="mb-3 text-[12px] text-red-400">{errorMsg}</p>
        )}
        <textarea
          ref={textareaRef}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addNota();
            }
          }}
          placeholder="¿Qué acabas de escuchar o aprender? (Intro para añadir · Shift+Intro para nueva línea)"
          rows={3}
          className="w-full resize-none rounded-xl border border-line bg-panel-2 p-4 text-[14px] leading-relaxed outline-none transition focus:border-gold-dim placeholder:text-text-dim"
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[11px] text-text-dim">
            {notas.length > 0
              ? `${notas.length} nota${notas.length !== 1 ? "s" : ""} capturada${notas.length !== 1 ? "s" : ""}`
              : "La sesión se procesará al cerrar"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={addNota}
              disabled={!draft.trim()}
              className="rounded-lg border border-line px-4 py-1.5 text-[12px] text-text-2 transition hover:border-gold-dim hover:text-foreground disabled:opacity-30"
            >
              Añadir nota
            </button>
            <button
              type="button"
              onClick={procesarSesion}
              disabled={notas.length === 0}
              className="flex items-center gap-1.5 rounded-lg bg-gold px-4 py-1.5 text-[12px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            >
              <span>✨</span> Cerrar y procesar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
