"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

type Resultado = { id: string; titulo: string; subtitulo: string; href: string; remindAtISO?: string };
type Categoria = "navegacion" | "clientes" | "tareas" | "knowledge" | "ideas" | "leads" | "recordatorios";
type Resultados = Record<Categoria, Resultado[]>;

const VACIO: Resultados = { navegacion: [], clientes: [], tareas: [], knowledge: [], ideas: [], leads: [], recordatorios: [] };

// "navegacion" va primero: es una coincidencia exacta de nombre de sección,
// más precisa que una búsqueda de texto libre en la BD.
const CATEGORIA_ORDEN: Categoria[] = ["navegacion", "clientes", "tareas", "knowledge", "ideas", "leads", "recordatorios"];
const CATEGORIA_LABEL: Record<Categoria, string> = {
  navegacion:    "Navegación",
  clientes:      "Clientes",
  tareas:        "Tareas",
  knowledge:     "Knowledge",
  ideas:         "Ideas",
  leads:         "Leads",
  recordatorios: "Recordatorios",
};
const CATEGORIA_ICONO: Record<Categoria, string> = {
  navegacion:    "🔗",
  clientes:      "👤",
  tareas:        "✅",
  knowledge:     "📚",
  ideas:         "💡",
  leads:         "🎯",
  recordatorios: "🔔",
};

const ACCESOS_RAPIDOS = [
  { icono: "☀️", label: "Mi día",      href: "/personal/cerebro" },
  { icono: "👤", label: "Clientes",    href: "/coaching/clientes" },
  { icono: "📚", label: "Knowledge",   href: "/personal/cerebro/knowledge" },
  { icono: "✅", label: "Nueva tarea", href: "/personal/cerebro/tareas" },
  { icono: "🎯", label: "Leads",       href: "/coaching/leads" },
];

// Evento propio para que la sidebar (u otro sitio) pueda abrir el buscador
// sin necesitar props/context — este modal se monta una sola vez en el
// layout raíz, desacoplado de quien lo dispare.
export const EVENTO_ABRIR_BUSQUEDA = "simbionte:abrir-busqueda";

function fmtRemindAt(iso: string): string {
  return new Date(iso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function GlobalSearchModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState("");
  const [resultados, setResultados] = useState<Resultados>(VACIO);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const reqIdRef = useRef(0);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setResultados(VACIO);
    setActiveIndex(0);
  }, []);

  // Abrir: Cmd/Ctrl+K desde cualquier página, o el evento propio (sidebar).
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape" && open) {
        close();
      }
    }
    function onEvento() { setOpen(true); }
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener(EVENTO_ABRIR_BUSQUEDA, onEvento);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(EVENTO_ABRIR_BUSQUEDA, onEvento);
    };
  }, [open, close]);

  // Animación de apertura + autofocus. No hace falta un "else setVisible(false)":
  // al cerrar, el componente devuelve null y se desmonta entero — el próximo
  // open vuelve a montar con useState(false) fresco.
  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => inputRef.current?.focus(), 0);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [open]);

  // Búsqueda con debounce 200ms — descarta respuestas fuera de orden. Con
  // query vacío no hace falta limpiar `resultados`: el render ya condiciona
  // en `hayQuery` y no lo muestra, así que quedarse obsoleto es inofensivo.
  useEffect(() => {
    if (!open || !query.trim()) return;
    const myId = ++reqIdRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/busqueda?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json() as Resultados;
        if (myId !== reqIdRef.current) return; // respuesta obsoleta
        setResultados(data);
        setActiveIndex(0);
      } finally {
        if (myId === reqIdRef.current) setLoading(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [query, open]);

  if (!open) return null;

  const flat = CATEGORIA_ORDEN.flatMap((cat) => resultados[cat].map((r) => ({ ...r, categoria: cat })));
  const hayQuery = query.trim().length > 0;
  const hayResultados = flat.length > 0;

  function navegar(href: string) {
    close();
    router.push(href);
  }

  function onKeyDownInput(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (hayResultados && flat[activeIndex]) navegar(flat[activeIndex].href);
    }
  }

  let indiceGlobal = -1;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm" onClick={close} />
      <div
        className={`fixed top-[18%] left-1/2 z-[201] w-[560px] max-w-[92vw] -translate-x-1/2 overflow-hidden rounded-xl border shadow-2xl shadow-black/60 transition-all duration-150 ${
          visible ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
        style={{ backgroundColor: "#1a1a1a", borderColor: "#2a2a2a" }}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3.5" style={{ borderColor: "#2a2a2a" }}>
          <span className="text-text-dim">⌘</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setLoading(e.target.value.trim().length > 0); }}
            onKeyDown={onKeyDownInput}
            placeholder="Buscar en Simbionte…"
            className="flex-1 bg-transparent text-lg outline-none placeholder:text-neutral-600"
          />
          {loading && <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-[3px] border-line border-t-gold" />}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {!hayQuery && (
            <div>
              <div className="px-2.5 py-1.5 text-xs tracking-wide uppercase" style={{ color: "#4b5563" }}>Accesos rápidos</div>
              {ACCESOS_RAPIDOS.map((a) => (
                <button
                  key={a.href}
                  type="button"
                  onClick={() => navegar(a.href)}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left text-[13.5px] text-neutral-200 transition hover:bg-[#2a2a2a]"
                >
                  <span className="text-[15px]">{a.icono}</span>
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {hayQuery && !hayResultados && !loading && (
            <p className="px-2.5 py-6 text-center text-[13px] text-text-dim">Sin resultados para &ldquo;{query}&rdquo;</p>
          )}

          {hayQuery && hayResultados && CATEGORIA_ORDEN.map((cat) => {
            const items = resultados[cat];
            if (items.length === 0) return null;
            return (
              <div key={cat} className="mb-1">
                <div className="px-2.5 py-1.5 text-xs tracking-wide uppercase" style={{ color: "#4b5563" }}>{CATEGORIA_LABEL[cat]}</div>
                {items.map((r) => {
                  indiceGlobal += 1;
                  const idx = indiceGlobal;
                  const activo = idx === activeIndex;
                  const subtitulo = cat === "recordatorios" && r.remindAtISO ? fmtRemindAt(r.remindAtISO) : r.subtitulo;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onMouseEnter={() => setActiveIndex(idx)}
                      onClick={() => navegar(r.href)}
                      className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2.5 text-left transition"
                      style={activo ? { backgroundColor: "#2a2a2a" } : undefined}
                    >
                      <span className="shrink-0 text-[15px]">{CATEGORIA_ICONO[cat]}</span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium text-neutral-100">{r.titulo}</div>
                        {subtitulo && <div className="truncate text-[11.5px] text-text-dim">{subtitulo}</div>}
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </>,
    document.body,
  );
}
