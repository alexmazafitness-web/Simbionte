"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  CATEGORIA_LIST, CATEGORIA_LABELS, CATEGORIA_COLOR,
  type CredencialVM, type CredencialCategoria,
} from "@/lib/personal/credenciales";
import { crearCredencial, editarCredencial, eliminarCredencial, type CredencialInput } from "@/lib/personal/credenciales-actions";
import { CredencialModal } from "./CredencialModal";

const REVEAL_MS = 5000;

function iniciales(s: string): string {
  const words = s.trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return s.trim().slice(0, 2).toUpperCase();
}

async function fetchValor(id: string): Promise<string | null> {
  const res = await fetch("/api/credenciales/reveal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!res.ok) return null;
  const data = await res.json() as { valor: string };
  return data.valor;
}

function CredencialCard({
  cred, onEdit, onDelete,
}: {
  cred: CredencialVM;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [revealed, setRevealed]     = useState<string | null>(null);
  const [loadingEye, setLoadingEye] = useState(false);
  const [copiado, setCopiado]       = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  async function toggleRevelar() {
    if (revealed) {
      if (timerRef.current) clearTimeout(timerRef.current);
      setRevealed(null);
      return;
    }
    setLoadingEye(true);
    const valor = await fetchValor(cred.id);
    setLoadingEye(false);
    if (!valor) return;
    setRevealed(valor);
    timerRef.current = setTimeout(() => setRevealed(null), REVEAL_MS);
  }

  async function copiar() {
    const valor = await fetchValor(cred.id);
    if (!valor) return;
    await navigator.clipboard.writeText(valor);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1500);
  }

  function handleDelete() {
    if (!confirmDel) { setConfirmDel(true); return; }
    onDelete();
  }

  const color = CATEGORIA_COLOR[cred.categoria];

  return (
    <div className="group flex flex-col rounded-xl border border-line-soft bg-panel p-4">
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{ backgroundColor: `${color}22`, color }}
          >
            {iniciales(cred.servicio || cred.nombre)}
          </span>
          <div>
            <h3 className="text-[13.5px] font-bold leading-snug">{cred.nombre}</h3>
            {cred.servicio && <p className="text-[11px] text-text-dim">{cred.servicio}</p>}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          {cred.url && (
            <a
              href={cred.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-text-dim hover:text-gold-dim"
              title="Abrir enlace"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path d="M10 13a5 5 0 007.07 0l2.83-2.83a5 5 0 00-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 00-7.07 0l-2.83 2.83a5 5 0 007.07 7.07l1.71-1.71" />
              </svg>
            </a>
          )}
          <button type="button" onClick={onEdit} className="rounded p-1 text-text-dim hover:text-foreground" title="Editar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDelete}
            onBlur={() => setConfirmDel(false)}
            className={`rounded p-1 ${confirmDel ? "text-red-400" : "text-text-dim hover:text-red-400"}`}
            title={confirmDel ? "¿Seguro? Pulsa de nuevo" : "Eliminar"}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
              <path d="M10 11v6M14 11v6M9 6V4h6v2" />
            </svg>
          </button>
        </div>
      </div>

      {cred.descripcion && <p className="mb-2.5 text-[12px] text-text-2">{cred.descripcion}</p>}

      <div className="mt-auto flex items-center gap-2 rounded-lg border border-line-soft bg-panel-2 px-3 py-2">
        <span className={`flex-1 truncate font-mono text-[12.5px] ${revealed ? "text-foreground" : "text-text-dim"}`}>
          {revealed ?? "•••••••••••••"}
        </span>
        <button
          type="button"
          onClick={toggleRevelar}
          disabled={loadingEye}
          className="rounded p-1 text-text-dim hover:text-foreground disabled:opacity-40"
          title={revealed ? "Ocultar" : "Revelar 5s"}
        >
          {revealed ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M17.94 17.94A10.94 10.94 0 0112 20c-7 0-11-8-11-8a18.6 18.6 0 015.06-5.94M9.9 4.24A10.94 10.94 0 0112 4c7 0 11 8 11 8a18.6 18.6 0 01-2.16 3.19M14.12 14.12a3 3 0 11-4.24-4.24" />
              <path d="M1 1l22 22" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
        <button
          type="button"
          onClick={copiar}
          className="rounded p-1 text-text-dim hover:text-foreground"
          title="Copiar al portapapeles"
        >
          {copiado ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5 text-ok">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
              <rect x="9" y="9" width="13" height="13" rx="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
          )}
        </button>
      </div>

      <div className="mt-2.5">
        <span
          className="rounded-md px-2 py-0.5 text-[9.5px] font-semibold tracking-[0.14em] uppercase"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {CATEGORIA_LABELS[cred.categoria]}
        </span>
      </div>
    </div>
  );
}

export function CredencialesSection({ credenciales }: { credenciales: CredencialVM[] }) {
  const [modal, setModal] = useState<null | { categoria: CredencialCategoria; id?: string }>(null);
  const [pending, startTransition] = useTransition();

  const editando = modal?.id ? credenciales.find((c) => c.id === modal.id) ?? null : null;

  function run(action: () => Promise<unknown>, onDone?: () => void) {
    startTransition(async () => { await action(); onDone?.(); });
  }

  return (
    <div className="mt-10 border-t border-line-soft pt-8">
      <div className="mb-5 flex items-center gap-2.5">
        <span className="text-sm font-semibold">🔐 Credenciales</span>
        <span className="text-[11px] text-text-dim">Bóveda de API keys, contraseñas y accesos</span>
        <button
          type="button"
          onClick={() => setModal({ categoria: "api_key" })}
          className="ml-auto rounded-lg bg-gold px-3.5 py-1.5 text-[12px] font-bold text-[#1a1208] transition hover:bg-gold-bright"
        >
          + Nueva credencial
        </button>
      </div>

      {credenciales.length === 0 ? (
        <p className="text-[13px] text-text-dim">Sin credenciales guardadas todavía.</p>
      ) : (
        <div className="flex flex-col gap-7">
          {CATEGORIA_LIST.map(({ value: cat }) => {
            const items = credenciales.filter((c) => c.categoria === cat);
            if (items.length === 0) return null;
            return (
              <div key={cat}>
                <div className="mb-2.5 text-[10.5px] font-bold tracking-[0.18em] text-text-dim uppercase">
                  {CATEGORIA_LABELS[cat]}
                </div>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-3">
                  {items.map((cred) => (
                    <CredencialCard
                      key={cred.id}
                      cred={cred}
                      onEdit={() => setModal({ categoria: cred.categoria, id: cred.id })}
                      onDelete={() => run(() => eliminarCredencial(cred.id))}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <CredencialModal
        open={modal !== null}
        onClose={() => setModal(null)}
        item={editando}
        categoriaPorDefecto={modal?.categoria ?? "api_key"}
        pending={pending}
        onSubmit={(input: CredencialInput) =>
          run(() => (editando ? editarCredencial(editando.id, input) : crearCredencial(input)), () => setModal(null))
        }
        onDelete={editando ? () => run(() => eliminarCredencial(editando.id), () => setModal(null)) : undefined}
      />
    </div>
  );
}
