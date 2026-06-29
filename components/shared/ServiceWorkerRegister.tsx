"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      // En dev (Turbopack/HMR) un SW activo de una sesión anterior puede seguir
      // controlando la página y sirviendo assets cacheados (bundle viejo),
      // provocando hydration mismatches y features rotas. Lo desregistramos,
      // purgamos sus caches y recargamos una vez para traer chunks frescos.
      if (!("serviceWorker" in navigator)) return;
      navigator.serviceWorker.getRegistrations().then(async (regs) => {
        const hadSW = regs.length > 0;
        await Promise.all(regs.map((reg) => reg.unregister()));
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
        // Si un SW viejo todavía controlaba esta carga, sus assets ya están en
        // memoria — recargar una vez. El guard `hadSW` evita el bucle: tras la
        // recarga ya no hay registros, así que no se vuelve a recargar.
        if (hadSW && navigator.serviceWorker.controller) {
          window.location.reload();
        }
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
