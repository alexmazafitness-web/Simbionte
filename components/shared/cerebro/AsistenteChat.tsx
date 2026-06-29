"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Msg = {
  id: string;
  rol: "user" | "assistant";
  texto: string;
  streaming?: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Quick action shortcuts ───────────────────────────────────────────────────

const QUICK_ACTIONS = [
  {
    label:   "Planifica mi día",
    mensaje: "Quiero que planifiques mi día de hoy. Usa el snapshot para organizar las tareas más urgentes en bloques horarios concretos.",
  },
  {
    label:   "¿Qué prioritizo?",
    mensaje: "¿Qué debería priorizar ahora mismo en el negocio? Dame los 3 puntos más urgentes.",
  },
  {
    label:   "Resumen semana",
    mensaje: "Dame un resumen ejecutivo de lo que ha pasado esta semana: revisiones, bajas, leads, cobros y tareas.",
  },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

function parseInline(str: string): React.ReactNode {
  const parts = str.split(/\*\*(.+?)\*\*/g);
  return parts.map((p, j) =>
    j % 2 === 1 ? (
      <strong key={j} style={{ fontWeight: 600, color: "rgba(255,255,255,0.9)" }}>
        {p}
      </strong>
    ) : p,
  );
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line === "") return <div key={i} style={{ height: 6 }} />;

    if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
      const content = line.replace(/^[•\-\*]\s/, "");
      return (
        <div key={i} style={{ display: "flex", gap: 8, lineHeight: "1.5" }}>
          <span style={{ color: "#555", marginTop: 1, flexShrink: 0 }}>•</span>
          <span style={{ color: "#ccc" }}>{parseInline(content)}</span>
        </div>
      );
    }

    if (line.startsWith("### ")) {
      return (
        <div key={i} style={{ marginTop: 8, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#C9A96E" }}>
          {parseInline(line.slice(4))}
        </div>
      );
    }

    if (line.startsWith("## ")) {
      return (
        <div key={i} style={{ marginTop: 8, fontWeight: 600, color: "#fff" }}>
          {parseInline(line.slice(3))}
        </div>
      );
    }

    return (
      <div key={i} style={{ lineHeight: "1.5", color: "#ccc" }}>
        {parseInline(line)}
      </div>
    );
  });
}

// ─── Typing / streaming indicator ────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", padding: "4px 0" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="animate-pulse"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            backgroundColor: "#444",
            animationDelay: `${i * 0.15}s`,
            animationDuration: "1s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AsistenteChat({ open, onClose }: Props) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [isBusy, setIsBusy]     = useState(false);

  const hasGreetedRef  = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const abortRef       = useRef<AbortController | null>(null);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-greeting when drawer opens for the first time
  useEffect(() => {
    if (open && !hasGreetedRef.current && messages.length === 0) {
      hasGreetedRef.current = true;
      void sendToApi("", "saludo");
    }
    if (open) {
      setTimeout(() => textareaRef.current?.focus(), 250);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Escape key closes drawer
  useEffect(() => {
    if (!open) return;
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape" && !isBusy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, isBusy, onClose]);

  // ── Streaming fetch ────────────────────────────────────────────────────────

  async function sendToApi(userMessage: string, tipo?: string) {
    if (isBusy) return;
    setIsBusy(true);

    const assistantId = `asst-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    if (userMessage && tipo !== "saludo") {
      setMessages((prev) => [
        ...prev,
        { id: `user-${Date.now()}`, rol: "user", texto: userMessage },
      ]);
    }

    setMessages((prev) => [
      ...prev,
      { id: assistantId, rol: "assistant", texto: "", streaming: true },
    ]);

    const ctrl = new AbortController();
    abortRef.current = ctrl;

    try {
      const res = await fetch("/api/asistente/chat", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ mensaje: userMessage, tipo }),
        signal:  ctrl.signal,
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let   acc     = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, texto: acc } : m)),
        );
      }

      setMessages((prev) =>
        prev.map((m) => (m.id === assistantId ? { ...m, streaming: false } : m)),
      );
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, texto: "Error al conectar con el asistente. Inténtalo de nuevo.", streaming: false }
              : m,
          ),
        );
      }
    } finally {
      setIsBusy(false);
      abortRef.current = null;
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }

  function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isBusy) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    void sendToApi(trimmed);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    // Wrapper identical to PlanificadorDrawer pattern
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ pointerEvents: open ? "auto" : "none" }}
      aria-hidden={!open}
    >
      {/* Scrim */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(0,0,0,0.55)",
          opacity: open ? 1 : 0,
        }}
        onClick={() => !isBusy && onClose()}
      />

      {/* Panel */}
      <div
        className="relative z-10 flex h-full flex-col"
        style={{
          width: 480,
          background: "#111",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
          transform: open ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        {/* Header */}
        <div
          className="flex shrink-0 items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center gap-2.5">
            <span style={{ fontSize: 18 }}>✨</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Asistente</div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#555" }}>
                Operaciones · Tiempo real
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isBusy}
            className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white/[0.07] disabled:opacity-40"
            style={{ color: "#555" }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
              <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3"
          style={{ scrollbarWidth: "thin", scrollbarColor: "#2a2a2a transparent" }}
        >
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <TypingDots />
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`mb-3 flex ${msg.rol === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.rol === "assistant" ? (
                <div
                  style={{
                    maxWidth: "92%",
                    background: "#161616",
                    border: "1px solid rgba(255,255,255,0.06)",
                    borderLeft: "3px solid rgba(201,169,110,0.45)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    fontSize: 13,
                  }}
                >
                  {msg.streaming && msg.texto === "" ? (
                    <TypingDots />
                  ) : (
                    <div>
                      {renderMarkdown(msg.texto)}
                      {msg.streaming && (
                        <span
                          className="animate-pulse"
                          style={{
                            display: "inline-block",
                            width: 2,
                            height: 14,
                            marginLeft: 2,
                            verticalAlign: "middle",
                            borderRadius: 2,
                            backgroundColor: "#C9A96E",
                          }}
                        />
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    maxWidth: "80%",
                    background: "#1e1e1e",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 10,
                    padding: "8px 13px",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.75)",
                  }}
                >
                  {msg.texto}
                </div>
              )}
            </div>
          ))}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick actions */}
        {!isBusy && messages.length > 0 && (
          <div
            className="shrink-0 px-4 pb-2 pt-2"
            style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
          >
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => sendToApi(a.mensaje)}
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    color: "#666",
                    cursor: "pointer",
                    transition: "color 0.15s, border-color 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.color = "#aaa"; (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.color = "#666"; (e.target as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div
          className="shrink-0 px-4 py-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-end gap-2 rounded-xl px-3 py-2"
            style={{ background: "#161616", border: "1px solid rgba(255,255,255,0.09)" }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onInput={() => {
                const el = textareaRef.current;
                if (!el) return;
                el.style.height = "auto";
                el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
              }}
              rows={1}
              disabled={isBusy}
              placeholder="Escribe un mensaje… (Enter para enviar)"
              className="flex-1 resize-none bg-transparent outline-none disabled:opacity-50"
              style={{ fontSize: 13, color: "#ddd", lineHeight: "1.5", maxHeight: 120 }}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!input.trim() || isBusy}
              className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition disabled:opacity-30"
              style={{ background: "rgba(201,169,110,0.18)", color: "#C9A96E" }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-3.5 w-3.5">
                <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <div className="mt-1 text-center" style={{ fontSize: 10, color: "#333" }}>
            Shift+Enter nueva línea · Esc para cerrar
          </div>
        </div>
      </div>
    </div>
  );
}
