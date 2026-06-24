"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // En dev (Turbopack/HMR) un SW activo puede interceptar y cachear mal
      // los chunks de _next/*, provocando bucles de descarga. Si quedó uno
      // registrado de una sesión anterior, lo desregistramos.
      navigator.serviceWorker?.getRegistrations().then((regs) => {
        regs.forEach((reg) => reg.unregister());
      });
      return;
    }

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch((error) => {
        console.error("Error al registrar el service worker:", error);
      });
    }
  }, []);

  return null;
}
