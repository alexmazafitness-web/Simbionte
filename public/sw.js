// Subir este número en cada despliegue invalida la caché vieja de los
// usuarios automáticamente (vía skipWaiting + clients.claim más abajo).
const CACHE_VERSION = "v4";
const CACHE_NAME = `simbionte-cache-${CACHE_VERSION}`;

// Solo assets verdaderamente estáticos — nunca rutas HTML (son dinámicas y
// dependen de la sesión del usuario).
const PRECACHE_URLS = ["/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // No interceptar:
  // - métodos distintos de GET
  // - requests cross-origin
  // - chunks de Next.js (_next/*)
  // - rutas de auth y API (siempre deben ir al servidor)
  // - documentos HTML (server-rendered, dependen de la sesión — cachearlos
  //   provoca que recargas normales sirvan HTML con la sesión ya caducada)
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/api/") ||
    event.request.destination === "document" ||
    event.request.headers.get("accept")?.includes("text/html")
  ) {
    return;
  }

  // Cache-first para assets estáticos (iconos, manifest, fuentes).
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request).then((response) => {
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        return response;
      });
    }),
  );
});

// ── Notificaciones push ───────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let payload = { title: "Simbionte", body: "" };
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: "Simbionte", body: event.data.text() };
    }
  }

  const title = payload.title || "Simbionte";
  const url = payload.url || "/";

  event.waitUntil(
    self.registration.showNotification(title, {
      body: payload.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url ? event.notification.data.url : "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientsArr) => {
      // Si ya hay una pestaña abierta en esa misma URL, solo enfocarla.
      const existente = clientsArr.find((c) => c.url.includes(url));
      if (existente && "focus" in existente) return existente.focus();

      // Si no, reusar cualquier pestaña de la app ya abierta y navegar en ella.
      if (clientsArr.length > 0 && "focus" in clientsArr[0]) {
        return clientsArr[0].navigate(url).then(() => clientsArr[0].focus());
      }

      // Sin ninguna pestaña abierta, abrir una nueva.
      return self.clients.openWindow(url);
    }),
  );
});
