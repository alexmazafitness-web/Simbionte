"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export function KnowledgeChatPanel({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      const data = await res.json() as { content: string };
      setMessages([...next, { role: "assistant", content: data.content }]);
    } catch {
      setMessages([...next, { role: "assistant", content: "No he podido conectar con el servidor. Inténtalo de nuevo." }]);
    } finally {
      setLoading(false);
      textareaRef.current?.focus();
    }
  }

  return (
    <aside className="flex w-[380px] shrink-0 flex-col border-l border-line-soft bg-[#111111]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line-soft px-4 py-3.5">
        <div>
          <div className="text-[10.5px] font-bold tracking-[0.2em] text-gold-dim uppercase">
            Consultar conocimiento
          </div>
          <div className="text-[11px] text-text-dim">Solo responde con tus notas</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded p-1 text-text-dim hover:text-foreground"
          aria-label="Cerrar chat"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="mt-8 flex flex-col items-center gap-3 text-center">
            <div className="text-3xl">🧠</div>
            <p className="text-[12.5px] leading-relaxed text-text-dim">
              Pregúntame sobre cualquier cosa que hayas guardado en tus notas.
            </p>
            <p className="text-[11.5px] text-text-dim opacity-60">
              Solo usaré el conocimiento de tu base, nunca información externa.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[88%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-gold/15 text-gold-bright"
                    : "bg-panel-2 text-foreground"
                }`}
              >
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="rounded-xl bg-panel-2 px-4 py-3">
                <div className="flex gap-1">
                  {[0, 150, 300].map((delay) => (
                    <span
                      key={delay}
                      className="h-1.5 w-1.5 animate-bounce rounded-full bg-text-dim"
                      style={{ animationDelay: `${delay}ms` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="border-t border-line-soft p-3">
        <div className="flex items-end gap-2 rounded-xl border border-line bg-panel-2 px-3 py-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Pregunta sobre tus notas… (Enter para enviar)"
            rows={2}
            className="flex-1 resize-none bg-transparent text-[13px] leading-relaxed outline-none placeholder:text-text-dim"
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || loading}
            className="mb-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gold text-[#1a1208] transition hover:bg-gold-bright disabled:opacity-40"
            aria-label="Enviar"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="h-3.5 w-3.5">
              <path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-text-dim opacity-50">Shift+Enter para nueva línea</p>
      </div>
    </aside>
  );
}
