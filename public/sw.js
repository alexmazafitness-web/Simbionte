// Subir este número en cada despliegue invalida la caché vieja de los
// usuarios automáticamente (vía skipWaiting + clients.claim más abajo).
const CACHE_VERSION = "v2";
const CACHE_NAME = `simbionte-cache-${CACHE_VERSION}`;
const PRECACHE_URLS = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)));
  // No esperar a que las pestañas con la versión anterior se cierren:
  // la nueva versión del SW toma el control en cuanto termina de instalar.
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

  // Nunca interceptar nada que no sea same-origin, los chunks/HMR de Next.js
  // (_next/*) ni las rutas de auth — interceptarlos rompe el dev server y
  // puede servir código de la app desactualizado en producción.
  if (
    event.request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith("/_next/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/api/")
  ) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          return response;
        })
        .catch(() => cached);
    }),
  );
});
