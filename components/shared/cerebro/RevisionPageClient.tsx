"use client";

import { useState, useTransition } from "react";
import { guardarRevision } from "@/lib/personal/meta-actions";
import type { RevisionVM } from "@/lib/personal/meta";

const textareaClass = "w-full resize-none rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim";

const PREGUNTAS_CIERRE: { key: keyof RevisionVM; label: string; hint: string }[] = [
  { key: "ingresos", label: "Ingresos de coaching esta semana", hint: "Clientes nuevos · renovaciones · leads en pipeline" },
  { key: "instagram", label: "¿Qué traccionó en Instagram?", hint: "Reels, stories, DMs abiertos, conversiones" },
  { key: "pendiente", label: "¿Qué quedó sin hacer y por qué?", hint: "¿Tiempo, energía o claridad?" },
];

const PREGUNTAS_SIGUIENTE: { key: keyof RevisionVM; label: string; hint: string }[] = [
  { key: "palanca", label: "La palanca de coaching será…", hint: "Una sola, la que más acerca al Norte" },
  { key: "tres", label: "Las 3 tareas que NO pueden fallar", hint: "Solo 3. Más allá son deseos, no compromisos" },
  { key: "recarga", label: "¿Cuándo recargo energía?", hint: "Planifícalo como planificas el trabajo" },
];

export function RevisionPageClient({ revision }: { revision: RevisionVM }) {
  const [valores, setValores] = useState(revision);
  const [guardado, setGuardado] = useState(false);
  const [pending, startTransition] = useTransition();

  function set(key: keyof RevisionVM, value: string) {
    setValores((v) => ({ ...v, [key]: value }));
    setGuardado(false);
  }

  function guardar() {
    startTransition(async () => {
      await guardarRevision(valores);
      setGuardado(true);
    });
  }

  return (
    <div className="mx-auto max-w-2xl px-10 py-10">
      <p className="mb-6 text-sm text-text-dim">Domingo · 20 min</p>

      <div className="mb-6 rounded-2xl border border-line-soft bg-panel p-5">
        <div className="mb-4 text-[10px] tracking-[0.2em] text-gold-dim uppercase">Cierre de semana</div>
        <div className="flex flex-col gap-4">
          {PREGUNTAS_CIERRE.map((p) => (
            <div key={p.key}>
              <label className="block text-[13px] font-medium">{p.label}</label>
              <span className="text-[11px] text-text-dim">{p.hint}</span>
              <textarea rows={2} className={`${textareaClass} mt-1.5`} value={valores[p.key]} onChange={(e) => set(p.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-line-soft bg-panel p-5">
        <div className="mb-4 text-[10px] tracking-[0.2em] text-gold-dim uppercase">Próxima semana</div>
        <div className="flex flex-col gap-4">
          {PREGUNTAS_SIGUIENTE.map((p) => (
            <div key={p.key}>
              <label className="block text-[13px] font-medium">{p.label}</label>
              <span className="text-[11px] text-text-dim">{p.hint}</span>
              <textarea rows={2} className={`${textareaClass} mt-1.5`} value={valores[p.key]} onChange={(e) => set(p.key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={pending}
        onClick={guardar}
        className="w-full rounded-lg bg-gold py-3 text-center text-[13.5px] font-bold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50"
      >
        Guardar revisión
      </button>
      {guardado && <p className="mt-3 text-center text-sm text-ok">Revisión guardada.</p>}
    </div>
  );
}
