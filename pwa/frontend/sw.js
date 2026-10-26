const CACHE_NAME = "raccoondev-hq-v2";
const CORE_ASSETS = ["/", "/styles.css", "/app.js", "/scenes.js", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  self.skipWaiting(); // activa la versión nueva de inmediato, no espera a cerrar pestañas
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()) // toma control de las pestañas ya abiertas
  );
});

self.addEventListener("fetch", (event) => {
  const url = event.request.url;
  // Las llamadas a /api/* siempre van a la red — nunca mostrar datos viejos.
  if (url.includes("/api/")) return;

  // Network-first para los assets propios: si hay red, siempre trae lo último
  // y actualiza la caché; la caché queda solo como fallback sin conexión.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
