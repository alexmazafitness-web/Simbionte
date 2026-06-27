"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import type { KnCategoryVM, FuenteTipo } from "@/lib/personal/knowledge";
import { FUENTE_LIST } from "@/lib/personal/knowledge";
import { crearNotaIA } from "@/lib/personal/knowledge-actions";

type Step = "form" | "procesando" | "preview" | "error";

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
  const [step, setStep]               = useState<Step>("form");
  const [notaBruta, setNotaBruta]     = useState("");
  const [fuenteTipo, setFuenteTipo]   = useState<FuenteTipo>("libro");
  const [fuenteNombre, setFuenteNombre] = useState("");
  const [categoriaId, setCategoriaId] = useState<string | null>(defaultCategoriaId);
  const [errorMsg, setErrorMsg]       = useState("");

  // Preview state (populated after AI call)
  const [titulo,       setTitulo]       = useState("");
  const [contenido,    setContenido]    = useState("");
  const [puntosText,   setPuntosText]   = useState("");
  const [categoriaPrev, setCategoriaPrev] = useState<string | null>(null);

  const [, startTransition] = useTransition();

  function resetForm() {
    setStep("form");
    setNotaBruta("");
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
        notaBruta,
        fuenteTipo,
        fuenteNombre,
        puntosClave,
        categoryId:       categoriaPrev,
      });
      resetForm();
      onSaved();
    });
  }

  const titleMap: Record<Step, string> = {
    form:       "Nueva nota",
    procesando: "Procesando…",
    preview:    "Revisar y guardar",
    error:      "Error",
  };

  return (
    <Modal open={open} onClose={handleClose} title={titleMap[step]} widthClassName="w-[620px]">
      {step === "form" && (
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.18em] text-text-dim uppercase">
              ¿Qué has aprendido?
            </label>
            <textarea
              autoFocus
              value={notaBruta}
              onChange={(e) => setNotaBruta(e.target.value)}
              placeholder="Escribe la idea, insight o aprendizaje en bruto. No te preocupes por el formato, la IA lo estructurará."
              rows={5}
              className="w-full resize-none rounded-lg border border-line bg-panel-2 p-3 text-[13px] leading-relaxed outline-none focus:border-gold-dim placeholder:text-text-dim"
            />
          </div>

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
              <span>✨</span> Procesar con IA
            </button>
          </div>
        </div>
      )}

      {step === "procesando" && (
        <div className="flex flex-col items-center gap-4 py-10">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-line border-t-gold" />
          <p className="text-[13px] text-text-dim">Claude está estructurando tu nota…</p>
        </div>
      )}

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
              Contenido procesado
            </label>
            <textarea
              value={contenido}
              onChange={(e) => setContenido(e.target.value)}
              rows={6}
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
              rows={4}
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
