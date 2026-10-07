// Service worker: prioriza SIEMPRE la versión más reciente desde internet.
// Solo usa la copia guardada localmente si no hay conexión — así, cada vez
// que se sube una actualización a GitHub, la app la toma de inmediato en
// vez de mostrar una versión vieja guardada en el celular/tablet.
// Los datos (API del Worker) NUNCA se guardan en caché: son privados y
// siempre se piden en vivo con el PIN del usuario.

const CACHE_NAME = 'sehinco-ingreso-v3';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './logo-sehinco.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Solo se cachean lecturas (GET). Subidas, guardados y borrados pasan directo.
  if (req.method !== 'GET') return;
  // Nunca interceptar la API de datos: siempre en vivo y nunca guardada en el tablet.
  if (req.url.includes('/api/')) return;

  // Network-first: intenta traer la versión más nueva de internet siempre que se pueda.
  event.respondWith(
    fetch(req)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
        }
        return response;
      })
      .catch(() => caches.match(req)) // sin internet: usa la última copia guardada
  );
});
