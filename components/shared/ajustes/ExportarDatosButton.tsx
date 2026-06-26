"use client";

import { useState } from "react";

export function ExportarDatosButton() {
  const [estado, setEstado] = useState<"idle" | "pending" | "error">("idle");

  async function handleClick() {
    setEstado("pending");
    try {
      const res = await fetch("/api/ajustes/export");
      if (!res.ok) throw new Error("La exportación falló");

      const disposition = res.headers.get("Content-Disposition") ?? "";
      const filename = disposition.match(/filename="(.+)"/)?.[1] ?? "simbionte-backup.json";

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      setEstado("idle");
    } catch {
      setEstado("error");
    }
  }

  return (
    <div>
      <button
        type="button"
        disabled={estado === "pending"}
        onClick={handleClick}
        className="rounded-lg bg-gold px-4 py-2.5 text-[13.5px] font-bold text-[#1a1208] hover:bg-gold-bright disabled:opacity-50"
      >
        {estado === "pending" ? "Exportando…" : "Exportar todos mis datos"}
      </button>
      {estado === "error" && <p className="mt-2.5 text-[12.5px] text-bad">No se pudo generar el backup. Inténtalo de nuevo.</p>}
    </div>
  );
}
