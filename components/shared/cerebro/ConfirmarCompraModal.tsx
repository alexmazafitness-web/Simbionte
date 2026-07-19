"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { fmtEUR } from "@/lib/personal/finanzas";
import type { DeseoVM } from "@/lib/personal/deseos";

type Resultado = { tieneReferencia: boolean; diferencia: number };

export function ConfirmarCompraModal({
  open,
  deseo,
  pending,
  onClose,
  onConfirm,
}: {
  open: boolean;
  deseo: DeseoVM | null;
  pending: boolean;
  onClose: () => void;
  onConfirm: (precioFinal: number | null) => void;
}) {
  const [precioFinal, setPrecioFinal] = useState(deseo?.precio != null ? String(deseo.precio) : "");
  const [resultado, setResultado] = useState<Resultado | null>(null);

  if (!open || !deseo) return null;

  function handleConfirm(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(precioFinal.replace(",", "."));
    const valor = precioFinal.trim() && Number.isFinite(n) ? n : null;
    onConfirm(valor);
    setResultado({
      tieneReferencia: deseo!.precio != null && valor != null,
      diferencia: deseo!.precio != null && valor != null ? deseo!.precio - valor : 0,
    });
  }

  function handleClose() {
    setResultado(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Marcar como comprado" widthClassName="w-[380px]">
      {resultado ? (
        <div className="space-y-4 text-center">
          {resultado.tieneReferencia ? (
            resultado.diferencia > 0 ? (
              <>
                <div className="text-3xl">🎉</div>
                <p className="text-[14px] font-semibold text-ok">
                  Has ahorrado {fmtEUR(resultado.diferencia, 2)}
                </p>
              </>
            ) : resultado.diferencia < 0 ? (
              <>
                <div className="text-3xl">💸</div>
                <p className="text-[14px] font-semibold text-bad">
                  Has pagado {fmtEUR(Math.abs(resultado.diferencia), 2)} más de lo previsto
                </p>
              </>
            ) : (
              <>
                <div className="text-3xl">✅</div>
                <p className="text-[14px] font-semibold text-text-2">Pagaste el precio previsto</p>
              </>
            )
          ) : (
            <>
              <div className="text-3xl">✅</div>
              <p className="text-[14px] font-semibold text-text-2">Marcado como comprado</p>
            </>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="w-full rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright"
          >
            Aceptar
          </button>
        </div>
      ) : (
        <form onSubmit={handleConfirm}>
          <p className="mb-3.5 truncate text-[13px] text-text-2">{deseo.nombre}</p>
          <div className="mb-4">
            <label className="mb-1.5 block text-[11px] tracking-wide text-text-dim uppercase">
              Precio final de compra
            </label>
            <input
              autoFocus
              className="w-full rounded-lg border border-line bg-panel-2 px-3 py-2.5 text-[13.5px] outline-none focus:border-gold-dim"
              value={precioFinal}
              onChange={(e) => setPrecioFinal(e.target.value)}
              placeholder="Ej: 329,99"
              inputMode="decimal"
            />
            {deseo.precio != null && (
              <p className="mt-1.5 text-[11px] text-text-dim">Precio estimado: {fmtEUR(deseo.precio, 2)}</p>
            )}
          </div>
          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={pending}
              className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50"
            >
              Confirmar
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
}
