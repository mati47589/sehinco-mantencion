// Service worker: prioriza SIEMPRE la versión más reciente desde internet.
// Solo usa la copia guardada localmente si no hay conexión — así, cada vez
// que se sube una actualización a GitHub, la app la toma de inmediato en
// vez de mostrar una versión vieja guardada en el celular/tablet.
// Los datos (Supabase) siempre se piden en vivo, nunca se cachean.

const CACHE_NAME = 'sehinco-ingreso-v2';
const SHELL_FILES = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

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
  // Nunca interceptar llamadas a Supabase: esos datos siempre deben pedirse en vivo.
  if (event.request.url.includes('supabase.co')) return;

  // Network-first: intenta traer la versión más nueva de internet siempre que se pueda.
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request)) // sin internet: usa la última copia guardada
  );
});
