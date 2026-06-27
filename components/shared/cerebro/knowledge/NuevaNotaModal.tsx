"use client";

import { useState, useTransition, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import type { KnCategoryVM, FuenteTipo } from "@/lib/personal/knowledge";
import { FUENTE_LIST } from "@/lib/personal/knowledge";
import { crearNotaIA } from "@/lib/personal/knowledge-actions";

type Step = "form" | "procesando" | "preview" | "error";
type ModoEntrada = "corta" | "larga";

export function NuevaNotaModal({
  open,
  onClose,
  categorias,
  defaultCategoriaId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  categorias: KnCategoryVM[];
  defaultCategoriaId: string | null;
  onSaved: () => void;
}) {
  const [step, setStep]                   = useState<Step>("form");
  const [modoEntrada, setModoEntrada]     = useState<ModoEntrada>("corta");
  const [notaBruta, setNotaBruta]         = useState("");
  const [archivoNombre, setArchivoNombre] = useState<string | null>(null);
  const [fuenteTipo, setFuenteTipo]       = useState<FuenteTipo>("libro");
  const [fuenteNombre, setFuenteNombre]   = useState("");
  const [categoriaId, setCategoriaId]     = useState<string | null>(defaultCategoriaId);
  const [errorMsg, setErrorMsg]           = useState("");

  const [titulo,        setTitulo]        = useState("");
  const [contenido,     setContenido]     = useState("");
  const [puntosText,    setPuntosText]    = useState("");
  const [categoriaPrev, setCategoriaPrev] = useState<string | null>(null);

  const [, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isLarga = modoEntrada === "larga";

  function resetForm() {
    setStep("form");
    setModoEntrada("corta");
    setNotaBruta("");
    setArchivoNombre(null);
    setFuenteTipo("libro");
    setFuenteNombre("");
    setCategoriaId(defaultCategoriaId);
    setTitulo("");
    setContenido("");
    setPuntosText("");
    setCategoriaPrev(null);
    setErrorMsg("");
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setArchivoNombre(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => setNotaBruta((ev.target?.result as string) ?? "");
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  }

  function clearArchivo() {
    setArchivoNombre(null);
    setNotaBruta("");
  }

  async function procesar() {
    if (!notaBruta.trim()) return;
    setStep("procesando");
    setErrorMsg("");
    try {
      const res = await fetch("/api/knowledge/procesar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notaBruta,
          fuenteTipo,
          fuenteNombre,
          categorias: categorias.map((c) => ({ id: c.id, name: c.name })),
          textoLargo: isLarga,
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
      setStep("error");
    }
  }

  function guardar() {
    const puntosClave = puntosText.split("\n").map((l) => l.trim()).filter(Boolean);
    startTransition(async () => {
      await crearNotaIA({
        title:            titulo,
        contentProcesado: contenido,
        notaBruta:        notaBruta,
        fuenteTipo,
        fuenteNombre,
        puntosClave,
        categoryId:       categoriaPrev,
        fuenteLongitud:   modoEntrada,
      });
      resetForm();
      onSaved();
    });
  }

  const titleMap: Record<Step, string> = {
    form:       "Nueva nota",
    procesando: isLarga ? "Extrayendo conocimiento…" : "Procesando…",
    preview:    "Revisar y guardar",
    error:      "Error",
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={titleMap[step]}
      widthClassName={isLarga ? "w-[780px]" : "w-[620px]"}
    >
      {/* ── FORM ──────────────────────────────────────────────────────────── */}
      {step === "form" && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 rounded-lg bg-panel-3 p-1 w-fit">
            {(["corta", "larga"] as ModoEntrada[]).map((modo) => (
              <button
                key={modo}
                type="button"
                onClick={() => setModoEntrada(modo)}
                className={
                  modoEntrada === modo
                    ? "rounded-md bg-gold px-4 py-1.5 text-[12px] font-bold text-[#1a1208]"
                    : "rounded-md px-4 py-1.5 text-[12px] text-text-dim hover:text-foreground"
                }
              >
                {modo === "corta" ? "Nota rápida" : "Texto largo"}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              {isLarga ? "Transcripción / artículo / apuntes" : "¿Qué has aprendido?"}
            </label>
            <textarea
              autoFocus
              value={notaBruta}
              onChange={(e) => setNotaBruta(e.target.value)}
              placeholder={
                isLarga
                  ? "Pega aquí la transcripción, artículo, apuntes de clase o cualquier texto largo. Claude extraerá únicamente el conocimiento valioso."
                  : "Escribe la idea, insight o aprendizaje en bruto. No te preocupes por el formato, la IA lo estructurará."
              }
              rows={isLarga ? 12 : 5}
              className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] leading-relaxed outline-none focus:border-gold-dim placeholder:text-text-dim"
            />

            {/* File upload (long mode only) */}
            {isLarga && (
              <div className="mt-2 flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-[12px] text-text-dim transition hover:border-gold-dim hover:text-foreground"
                >
                  📎 Subir .txt / .md
                </button>
                {archivoNombre ? (
                  <span className="flex items-center gap-1.5 text-[12px] text-text-dim">
                    {archivoNombre}
                    <button
                      type="button"
                      onClick={clearArchivo}
                      className="hover:text-foreground"
                    >
                      ✕
                    </button>
                  </span>
                ) : notaBruta.length > 0 ? (
                  <span className="text-[11px] text-text-dim">
                    {notaBruta.length.toLocaleString()} caracteres
                  </span>
                ) : null}
              </div>
            )}
          </div>

          {/* Fuente */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
                Fuente
              </label>
              <select
                value={fuenteTipo}
                onChange={(e) => setFuenteTipo(e.target.value as FuenteTipo)}
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim"
              >
                {FUENTE_LIST.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
                Nombre de la fuente
              </label>
              <input
                value={fuenteNombre}
                onChange={(e) => setFuenteNombre(e.target.value)}
                placeholder="Ej: Huberman Lab, Atomic Habits…"
                className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim placeholder:text-text-dim"
              />
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              Categoría{" "}
              <span className="normal-case font-normal tracking-normal text-text-dim">
                (la IA sugerirá una si la dejas en blanco)
              </span>
            </label>
            <select
              value={categoriaId ?? ""}
              onChange={(e) => setCategoriaId(e.target.value || null)}
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim"
            >
              <option value="">Sin categoría</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg px-4 py-2 text-[12.5px] text-text-dim hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={procesar}
              disabled={!notaBruta.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gold px-5 py-2 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            >
              <span>✨</span>{" "}
              {isLarga ? "Extraer conocimiento" : "Procesar con IA"}
            </button>
          </div>
        </div>
      )}

      {/* ── PROCESANDO ────────────────────────────────────────────────────── */}
      {step === "procesando" && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
          <p className="text-[13px] text-text-dim">
            {isLarga
              ? "Claude está extrayendo el conocimiento valioso… puede tardar unos segundos"
              : "Claude está estructurando tu nota…"}
          </p>
        </div>
      )}

      {/* ── ERROR ─────────────────────────────────────────────────────────── */}
      {step === "error" && (
        <div className="space-y-4 py-2">
          <p className="text-[13px] text-red-400">{errorMsg}</p>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="text-[12.5px] text-gold-dim hover:text-gold"
          >
            ← Volver a intentarlo
          </button>
        </div>
      )}

      {/* ── PREVIEW ───────────────────────────────────────────────────────── */}
      {step === "preview" && (
        <div className="space-y-4">
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
              {isLarga ? "Conocimiento extraído" : "Contenido procesado"}
            </label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={isLarga ? 14 : 6}
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
              rows={isLarga ? 8 : 4}
              placeholder="Un punto clave por línea"
              className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] outline-none focus:border-gold-dim placeholder:text-text-dim"
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
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setStep("form")}
              className="text-[12.5px] text-text-dim hover:text-foreground"
            >
              ← Volver a editar
            </button>
            <button
              type="button"
              onClick={guardar}
              disabled={!titulo.trim()}
              className="rounded-lg bg-gold px-5 py-2 text-[12.5px] font-bold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            >
              Guardar nota
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
