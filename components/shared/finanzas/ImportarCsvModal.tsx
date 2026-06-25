"use client";

import { useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { fmtEUR } from "@/lib/personal/finanzas";
import type { FilaCsv } from "@/lib/personal/finanzas-actions";

// Mismo parseo "naive" que el HTML: split por comas, cabecera en minúsculas,
// sin soporte de comillas con comas internas — coherente con lo que pide
// el CSV de referencia (fecha, descripcion, importe, tipo, categoria).
function parseCsv(texto: string): FilaCsv[] {
  const lineas = texto.split("\n").filter((l) => l.trim());
  if (lineas.length === 0) return [];

  const cabecera = lineas[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  const iF = cabecera.indexOf("fecha");
  const iD = cabecera.indexOf("descripcion");
  const iI = cabecera.indexOf("importe");
  const iT = cabecera.indexOf("tipo");
  const iC = cabecera.indexOf("categoria");

  return lineas
    .slice(1)
    .map((l) => {
      const cols = l.split(",").map((c) => c.trim().replace(/"/g, ""));
      return {
        fecha: cols[iF] || "",
        descripcion: cols[iD] || "",
        importe: parseFloat(cols[iI]) || 0,
        tipo: (cols[iT] || "gasto").toLowerCase(),
        categoria: cols[iC] || "Otros",
      };
    })
    // "fecha" es obligatoria en la tabla — se descarta aquí para que el
    // contador de la previsualización coincida con lo que se importará.
    .filter((t) => t.importe > 0 && t.fecha.trim() !== "");
}

export function ImportarCsvModal({
  open,
  onClose,
  pending,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onConfirm: (filas: FilaCsv[]) => void;
}) {
  const [filas, setFilas] = useState<FilaCsv[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  function handleClose() {
    setFilas([]);
    onClose();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const texto = String(ev.target?.result ?? "");
      setFilas(parseCsv(texto));
    };
    reader.readAsText(file, "UTF-8");
  }

  return (
    <Modal open={open} onClose={handleClose} title="Importar CSV">
      <p className="mb-4 text-[12.5px] leading-relaxed text-text-dim">
        El CSV debe tener las columnas:{" "}
        <code className="rounded bg-panel-3 px-1.5 py-0.5 text-gold">fecha, descripcion, importe, tipo, categoria</code>
      </p>

      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full rounded-lg border border-dashed border-line py-8 text-center text-text-dim hover:border-gold-dim hover:bg-[rgba(201,169,110,.06)] hover:text-text-2"
      >
        <div className="mb-1.5 text-xl">↑</div>
        <div className="text-[12.5px] font-semibold">Seleccionar CSV</div>
        <div className="mt-0.5 text-[10.5px]">Exportación del banco o cualquier CSV compatible</div>
      </button>
      <input ref={fileInputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

      {filas.length > 0 && (
        <div className="mt-3.5">
          <p className="mb-2 text-[11px] text-text-dim">{filas.length} transacciones detectadas</p>
          <div className="max-h-40 overflow-y-auto rounded-lg border border-line-soft">
            <table className="w-full text-[11.5px]">
              <thead>
                <tr className="bg-panel-2">
                  <th className="px-2.5 py-1.5 text-left text-text-dim">Fecha</th>
                  <th className="px-2.5 py-1.5 text-left text-text-dim">Descripción</th>
                  <th className="px-2.5 py-1.5 text-left text-text-dim">Importe</th>
                  <th className="px-2.5 py-1.5 text-left text-text-dim">Tipo</th>
                </tr>
              </thead>
              <tbody>
                {filas.slice(0, 8).map((f, i) => (
                  <tr key={i} className="border-t border-line-soft">
                    <td className="px-2.5 py-1.5 whitespace-nowrap">{f.fecha}</td>
                    <td className="max-w-[160px] truncate px-2.5 py-1.5">{f.descripcion}</td>
                    <td className="px-2.5 py-1.5 whitespace-nowrap">{fmtEUR(f.importe)}</td>
                    <td className="px-2.5 py-1.5">{f.tipo}</td>
                  </tr>
                ))}
                {filas.length > 8 && (
                  <tr className="border-t border-line-soft">
                    <td colSpan={4} className="px-2.5 py-1.5 text-text-dim">
                      … y {filas.length - 8} más
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4 flex gap-2.5">
        <button type="button" onClick={handleClose} className="flex-1 rounded-lg bg-panel-3 py-2.5 text-[13.5px] font-semibold text-text-2 hover:text-foreground">
          Cancelar
        </button>
        {filas.length > 0 && (
          <button
            type="button"
            disabled={pending}
            onClick={() => onConfirm(filas)}
            className="flex-1 rounded-lg bg-gold py-2.5 text-[13.5px] font-semibold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50"
          >
            Importar
          </button>
        )}
      </div>
    </Modal>
  );
}
