// Service worker mínimo: habilita la instalación como app (PWA). Sin caché, para no servir precios u existencias viejas.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
