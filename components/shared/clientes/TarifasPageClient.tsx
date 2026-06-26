"use client";

import { useState, useTransition } from "react";
import { RECURRENCIAS, type Recurrencia } from "@/lib/coaching/constants";
import type { Tarifa } from "@/lib/coaching/tarifas";
import { crearTarifa, editarTarifa, eliminarTarifa } from "@/lib/coaching/tarifas-actions";

function TarifaEditCard({
  initialPrecio,
  initialRecurrencia,
  onSave,
  onCancel,
  onDelete,
  pending,
}: {
  initialPrecio: number | "";
  initialRecurrencia: Recurrencia | "";
  onSave: (precio: number, recurrencia: Recurrencia) => void;
  onCancel: () => void;
  onDelete?: () => void;
  pending: boolean;
}) {
  const [valor, setValor] = useState(String(initialPrecio));
  const [recurrencia, setRecurrencia] = useState<Recurrencia | "">(initialRecurrencia);

  return (
    <div className="rounded-xl border border-line-soft bg-panel p-4">
      <input
        type="number"
        min={0}
        autoFocus
        placeholder="Importe en €"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="mb-2 w-full rounded-lg border border-gold-dim bg-panel-2 px-2.5 py-2 text-sm outline-none"
      />
      <select
        value={recurrencia}
        onChange={(e) => setRecurrencia(e.target.value as Recurrencia)}
        className="mb-2 w-full rounded-lg border border-gold-dim bg-panel-2 px-2.5 py-2 text-sm outline-none"
      >
        <option value="" disabled>
          Recurrencia…
        </option>
        {RECURRENCIAS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            const n = Math.max(0, Math.round(Number(valor) || 0));
            if (n && recurrencia) onSave(n, recurrencia);
          }}
          className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-foreground"
        >
          Guardar
        </button>
        <button type="button" onClick={onCancel} className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-foreground">
          Cancelar
        </button>
        {onDelete && (
          <button type="button" onClick={onDelete} className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-bad">
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}

export function TarifasPageClient({ tarifas }: { tarifas: Tarifa[] }) {
  const [editingId, setEditingId] = useState<string | null | "__new__">(null);
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      await action();
      setEditingId(null);
    });
  }

  return (
    <div className="px-10 py-10">
      <div className="mb-6 flex items-center gap-2.5 text-[10px] tracking-[0.24em] text-gold-dim uppercase">
        Tarifas disponibles
        <span className="rounded-full bg-[rgba(201,169,110,.12)] px-2.5 py-0.5 font-display text-[13px] text-gold-bright">{tarifas.length}</span>
        <span className="h-px flex-1 bg-line" />
      </div>

      <div className="mb-6 grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
        {tarifas.map((t) =>
          editingId === t.id ? (
            <TarifaEditCard
              key={t.id}
              initialPrecio={t.precio}
              initialRecurrencia={t.recurrencia}
              pending={pending}
              onSave={(precio, recurrencia) => run(() => editarTarifa(t.id, precio, recurrencia))}
              onCancel={() => setEditingId(null)}
              onDelete={() => run(() => eliminarTarifa(t.id))}
            />
          ) : (
            <div key={t.id} className="rounded-xl border border-line-soft bg-panel p-4">
              <div className="font-display text-3xl leading-none text-gold">
                {t.precio}
                <span className="ml-0.5 text-[15px] text-text-dim">€</span>
              </div>
              <div className="mt-1 text-[11.5px] text-text-dim">{t.recurrencia}</div>
              <div className="mt-2.5 flex gap-2">
                <button type="button" onClick={() => setEditingId(t.id)} className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-foreground">
                  Editar
                </button>
                <button type="button" onClick={() => run(() => eliminarTarifa(t.id))} className="rounded-md bg-panel-2 px-2.5 py-1 text-[11.5px] font-semibold text-text-dim hover:text-bad">
                  Eliminar
                </button>
              </div>
            </div>
          ),
        )}

        {editingId === "__new__" ? (
          <TarifaEditCard
            initialPrecio=""
            initialRecurrencia=""
            pending={pending}
            onSave={(precio, recurrencia) => run(() => crearTarifa(precio, recurrencia))}
            onCancel={() => setEditingId(null)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setEditingId("__new__")}
            className="flex min-h-[90px] items-center justify-center rounded-xl border border-dashed border-line text-sm font-semibold text-gold-dim hover:border-gold-dim hover:text-gold-bright"
          >
            + Añadir tarifa
          </button>
        )}
      </div>

      <div className="rounded-2xl border border-dashed border-line bg-panel p-5 text-[13px] leading-relaxed text-text-2">
        Estas son las cuotas que aparecen al crear un cliente nuevo. Añade, edita o elimina las que quieras — los clientes ya
        existentes no se ven afectados, cada uno conserva su propia cuota.
      </div>
    </div>
  );
}
