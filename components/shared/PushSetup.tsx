"use client";

import { useEffect } from "react";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Se monta solo cuando ya hay sesión confirmada (gateado en el layout raíz
// por `data.user`). Pide permiso una única vez — si ya está concedido o
// denegado, nunca lo vuelve a solicitar.
export function PushSetup() {
  useEffect(() => {
    console.log("[push] PushSetup montado, efecto ejecutándose");

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    console.log("[push] soporte:", {
      serviceWorker: "serviceWorker" in navigator,
      PushManager: "PushManager" in window,
      vapidKeyPresente: !!vapidKey,
    });
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !vapidKey) {
      console.log("[push] abortando: falta soporte del navegador o NEXT_PUBLIC_VAPID_PUBLIC_KEY no llegó al bundle del cliente");
      return;
    }

    async function setup() {
      console.log("[push] Notification.permission actual:", Notification.permission);
      if (Notification.permission === "denied") {
        console.log("[push] abortando: permiso denegado");
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      console.log("[push] service worker listo:", registration.active?.state);

      let subscription = await registration.pushManager.getSubscription();
      console.log("[push] suscripción existente:", subscription ? subscription.endpoint : null);

      if (!subscription) {
        if (Notification.permission === "default") {
          console.log("[push] permiso 'default' — solicitando ahora");
          const resultado = await Notification.requestPermission();
          console.log("[push] resultado de requestPermission:", resultado);
          if (resultado !== "granted") {
            console.log("[push] abortando: el usuario no concedió el permiso");
            return;
          }
        }
        if (Notification.permission !== "granted") {
          console.log("[push] abortando: permiso no concedido tras el chequeo (", Notification.permission, ")");
          return;
        }

        console.log("[push] llamando a pushManager.subscribe()");
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey!) as BufferSource,
          });
          console.log("[push] nueva suscripción creada:", subscription.endpoint);
        } catch (err) {
          console.log("[push] pushManager.subscribe() lanzó un error:", err);
          throw err;
        }
      } else {
        console.log("[push] ya había suscripción, no se vuelve a pedir permiso ni a suscribir");
      }

      const json = subscription.toJSON();
      console.log("[push] enviando a /api/push/subscribe:", json.endpoint);
      try {
        const res = await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys, userAgent: navigator.userAgent }),
        });
        console.log("[push] respuesta de /api/push/subscribe:", res.status, await res.clone().text().catch(() => ""));
      } catch (err) {
        console.log("[push] fetch a /api/push/subscribe falló (silencioso, se reintenta en la próxima carga):", err);
        // Fallo silencioso — se reintenta en la próxima carga de página.
      }
    }

    setup().catch((err) => console.log("[push] error no controlado en setup():", err));
  }, []);

  return null;
}
