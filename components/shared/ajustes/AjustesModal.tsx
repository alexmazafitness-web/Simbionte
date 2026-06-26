"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { ExportarDatosButton } from "./ExportarDatosButton";
import { createClient } from "@/lib/supabase/client";

type Seccion = "general";

const GearIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="h-[15px] w-[15px] shrink-0">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33h0a1.65 1.65 0 001-1.51V3a2 2 0 114 0v.09a1.65 1.65 0 001 1.51h0a1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82v0a1.65 1.65 0 001.51 1H21a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const SECCIONES: { id: Seccion; label: string }[] = [{ id: "general", label: "General" }];

export function AjustesModal({
  open,
  onClose,
  name,
  email,
}: {
  open: boolean;
  onClose: () => void;
  name: string | null;
  email: string | null;
}) {
  const router = useRouter();
  const [seccion, setSeccion] = useState<Seccion>("general");

  const [localName, setLocalName] = useState(name ?? "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  function startEdit() {
    setDraft(localName);
    setSaveError(null);
    setEditing(true);
  }

  function cancelEdit() {
    setEditing(false);
    setSaveError(null);
  }

  async function handleSave() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === localName) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();

      // 1. Comprobar si hay sesión activa en el browser client
      const { data: sessionData } = await supabase.auth.getSession();
      console.log("[guardarNombre] sesión actual:", sessionData.session);

      if (!sessionData.session) {
        // 2. Sin sesión — intentar refrescar usando el refresh token en cookies
        console.log("[guardarNombre] sin sesión, intentando refreshSession...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[guardarNombre] refreshSession falló:", refreshError);
          setSaveError("La sesión ha caducado. Por favor, cierra sesión y vuelve a iniciar sesión.");
          return;
        }
      }

      // 3. Actualizar nombre con sesión válida (original o recién refrescada)
      const { error } = await supabase.auth.updateUser({ data: { name: trimmed } });
      if (error) {
        console.error("[guardarNombre] updateUser error:", error);
        setSaveError(`${error.status ?? ""} ${error.message}`.trim());
        return;
      }

      setLocalName(trimmed);
      setEditing(false);
      router.refresh();
    } catch (err) {
      console.error("[guardarNombre] catch:", err);
      setSaveError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Ajustes" widthClassName="w-[620px]">
      <div className="-mx-6 -mb-6 flex h-[400px]">
        {/* Nav izquierda */}
        <div className="w-40 shrink-0 border-r border-line-soft p-4">
          {SECCIONES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSeccion(s.id)}
              className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-[13px] font-medium transition ${
                seccion === s.id ? "bg-[rgba(201,169,110,.14)] text-gold-bright" : "text-text-2 hover:bg-panel-2"
              }`}
            >
              <GearIcon />
              {s.label}
            </button>
          ))}
        </div>

        {/* Panel derecho */}
        <div className="flex-1 overflow-y-auto p-6">
          {seccion === "general" && (
            <div>
              {/* Avatar + nombre + email */}
              <div className="mb-6 flex items-center gap-3.5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#C9A96E] to-[#9a7c47] text-lg font-bold text-[#1a1208]">
                  {(localName || email || "A")[0]!.toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  {editing ? (
                    <div className="flex items-center gap-1.5">
                      <input
                        autoFocus
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSave();
                          if (e.key === "Escape") cancelEdit();
                        }}
                        className="min-w-0 flex-1 rounded-md border border-line bg-panel-2 px-2.5 py-1 text-[13.5px] font-bold outline-none focus:border-gold"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={handleSave}
                        className="rounded-md px-2.5 py-1 text-[12px] font-semibold text-gold-bright hover:bg-[rgba(201,169,110,.12)] disabled:opacity-50"
                      >
                        {saving ? "…" : "Guardar"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="rounded-md px-2 py-1 text-[12px] text-text-dim hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="truncate font-heading text-base font-bold">{localName || "Sin nombre"}</span>
                      <button
                        type="button"
                        onClick={startEdit}
                        className="shrink-0 rounded p-0.5 text-text-dim hover:text-gold-bright"
                        title="Editar nombre"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                    </div>
                  )}
                  {saveError && <p className="mt-1 text-[11.5px] text-bad">Error: {saveError}</p>}
                  <div className="truncate text-[12.5px] text-text-dim">{email ?? "—"}</div>
                </div>
              </div>

              {/* Backup */}
              <div className="border-t border-line-soft pt-5">
                <div className="mb-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">Backup de seguridad</div>
                <p className="mb-4 text-[13px] leading-relaxed text-text-2">
                  Descarga un archivo JSON con todos tus datos de Personal y Coaching, tal como están ahora en Supabase.
                </p>
                <ExportarDatosButton />
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
