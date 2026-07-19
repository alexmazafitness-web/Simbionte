"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { crearNota } from "@/lib/coaching/clientes-actions";
import { crearRecordatorio } from "@/lib/personal/reminders-actions";
import { CATEGORIAS, CATEGORIA_LABEL, type Categoria } from "@/lib/coaching/constants";
import type { ClienteVM, NotaItem } from "@/lib/coaching/clientes";
import { Drawer } from "@/components/ui/Drawer";

// ── category visual config ────────────────────────────────────────────────────

const CAT_STYLE: Record<Categoria, { bg: string; text: string }> = {
  nutricion:   { bg: "#2A4A38", text: "#4ade80" },
  seguimiento: { bg: "#1a1a1a", text: "#C9A96E" },   // dorado
  meso:        { bg: "#243B55", text: "#93c5fd" },
  otros:       { bg: "#2a2a2a", text: "#9ca3af" },
};

// ── helpers ───────────────────────────────────────────────────────────────────

function buildReminderISO(dateStr: string): string {
  // dateStr = "YYYY-MM-DD" — store at 09:00 local time so it shows in the calendar
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y!, m! - 1, d!, 9, 0, 0).toISOString();
}

// ── sub-components ────────────────────────────────────────────────────────────

export function CatChip({ cat }: { cat: Categoria }) {
  const s = CAT_STYLE[cat];
  return (
    <span
      className="shrink-0 rounded px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide"
      style={{ backgroundColor: s.bg, color: s.text, border: `2px solid ${s.bg === "#1a1a1a" ? "#2a2a2a" : s.bg}` }}
    >
      {CATEGORIA_LABEL[cat]}
    </span>
  );
}

function NotaRow({ nota }: { nota: NotaItem }) {
  return (
    <div
      className="flex items-start gap-2.5 rounded-lg border p-3"
      style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
    >
      <CatChip cat={nota.categoria} />
      <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-[#c0c0c0]">
        {nota.texto}
      </p>
    </div>
  );
}

// ── main component ────────────────────────────────────────────────────────────

export function RevisionNotasDrawer({
  cliente,
  onClose,
}: {
  cliente: ClienteVM | null;
  onClose: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [cat, setCat] = useState<Categoria | null>(null);
  const [texto, setTexto] = useState("");
  const [fechaSeguimiento, setFechaSeguimiento] = useState("");
  const [catError, setCatError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const allNotas: NotaItem[] = CATEGORIAS.flatMap((c) => cliente?.notas[c] ?? []).sort(
    (a, b) => b.fecha.localeCompare(a.fecha),
  );

  function resetForm() {
    setCat(null);
    setTexto("");
    setFechaSeguimiento("");
    setCatError(false);
  }

  function handleGuardar() {
    if (!cliente || !texto.trim()) return;
    if (!cat) {
      setCatError(true);
      return;
    }
    setCatError(false);
    startTransition(async () => {
      await crearNota(cliente.id, cat, texto.trim());

      if (fechaSeguimiento) {
        const whenISO = buildReminderISO(fechaSeguimiento);
        const reminderText = `${cliente.nombre}: ${texto.trim()}`;
        await crearRecordatorio(reminderText, whenISO, "coaching");
      }

      router.refresh();
      resetForm();
      textareaRef.current?.focus();
    });
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  return (
    <Drawer open={!!cliente} onClose={handleClose}>
      {cliente && (
        <div className="flex h-full flex-col">

          {/* Header */}
          <div className="flex items-start justify-between border-b px-6 py-5" style={{ borderColor: "#2a2a2a" }}>
            <div>
              <p className="text-[10px] uppercase tracking-[0.15em] text-neutral-600">Revisión pendiente</p>
              <h2 className="mt-0.5 font-heading text-[20px] font-semibold text-white">{cliente.nombre}</h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="mt-0.5 rounded-md p-1 text-neutral-600 transition hover:text-neutral-300"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Existing notes */}
          <div className="flex-1 overflow-y-auto px-6 py-5">
            {allNotas.length === 0 ? (
              <p className="text-[13px] text-neutral-600">Sin notas aún.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {allNotas.map((n) => <NotaRow key={n.id} nota={n} />)}
              </div>
            )}
          </div>

          {/* Add note form */}
          <div className="border-t px-6 py-5" style={{ borderColor: "#2a2a2a" }}>
            <p className="mb-3 text-[10px] uppercase tracking-[0.15em] text-neutral-600">Nueva nota</p>

            {/* Category selector */}
            <div className="mb-1.5 flex gap-1.5">
              {CATEGORIAS.map((c) => {
                const s = CAT_STYLE[c];
                const active = cat === c;
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => { setCat(c); setCatError(false); }}
                    className="rounded px-2 py-1 text-[10px] font-semibold uppercase tracking-wide transition"
                    style={{
                      backgroundColor: active ? s.bg : "#1e1e1e",
                      color: active ? s.text : "#6b7280",
                      border: `2px solid ${active ? (s.bg === "#1a1a1a" ? "#3a3a3a" : s.bg) : "#2a2a2a"}`,
                    }}
                  >
                    {CATEGORIA_LABEL[c]}
                  </button>
                );
              })}
            </div>
            {catError && (
              <p className="mb-3 text-[11px] text-red-400">Selecciona una categoría</p>
            )}
            {!catError && <div className="mb-3" />}

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGuardar();
              }}
              placeholder="Escribe la nota…"
              rows={3}
              className="mb-3 w-full resize-none rounded-lg border bg-white/[0.02] px-3 py-2.5 text-[13px] text-[#e5e5e5] outline-none transition placeholder:text-neutral-700 focus:border-[#C9A96E]/40"
              style={{ borderColor: "#2a2a2a" }}
            />

            {/* Date field */}
            <div className="mb-4">
              <label className="mb-1.5 block text-[10px] uppercase tracking-[0.12em] text-neutral-600">
                Fecha de seguimiento (opcional)
              </label>
              <input
                type="date"
                value={fechaSeguimiento}
                onChange={(e) => setFechaSeguimiento(e.target.value)}
                className="w-full rounded-lg border bg-white/[0.02] px-3 py-2 text-[13px] tabular-nums text-[#e5e5e5] outline-none transition focus:border-[#C9A96E]/40 [color-scheme:dark]"
                style={{ borderColor: "#2a2a2a" }}
              />
              {fechaSeguimiento && (
                <p className="mt-1 text-[10.5px] text-neutral-600">
                  Se creará un recordatorio el {new Date(fechaSeguimiento + "T12:00:00").toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long" })} a las 09:00
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] text-neutral-700">⌘ Enter para guardar</span>
              <button
                type="button"
                disabled={!texto.trim() || pending}
                onClick={handleGuardar}
                className="rounded-lg bg-[#C9A96E]/20 px-4 py-2 text-[12px] font-semibold text-[#C9A96E] transition hover:bg-[#C9A96E]/30 disabled:opacity-40"
              >
                {pending ? "…" : "Guardar nota"}
              </button>
            </div>
          </div>

        </div>
      )}
    </Drawer>
  );
}
