// Service worker: la app funciona sin conexión.
const VERSION = 'senda-v16';
const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest', 'css/estilo.css',
  'img/emblema.svg', 'img/icono-192.png', 'img/icono-512.png',
  'js/app.js', 'js/ui.js', 'js/motor.js', 'js/almacen.js', 'js/firebase-config.js',
  'js/datos/reglas.js', 'js/datos/conjuros.js', 'js/datos/conjuros/nivel0-1.js', 'js/datos/conjuros/nivel2-3.js', 'js/datos/conjuros/nivel4-5.js', 'js/datos/conjuros/nivel6-9.js', 'js/vistas/grimorio.js', 'js/datos/opciones.js', 'js/vistas/nivel.js', 'js/vistas/cronica.js', 'js/vistas/iniciativa.js', 'js/vistas/contenido.js', 'js/datos/personalizado.js', 'js/datos/nombres.js', 'js/vistas/nombres.js', 'js/harptos.js', 'js/estacion.js', 'js/datos/clases.js', 'js/datos/especies.js', 'js/datos/trasfondos.js', 'js/datos/equipo.js',
  'js/vistas/comun.js', 'js/vistas/inicio.js', 'js/vistas/creador.js', 'js/vistas/hoja.js',
  'js/vistas/partidas.js', 'js/vistas/compendio.js', 'js/vistas/dados.js',
];

self.addEventListener('install', (e) => {
  // cache: 'reload' para no coger copias antiguas de la caché de GitHub
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS.map((u) => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('message', (e) => { if (e.data === 'version') e.source && e.source.postMessage({ version: VERSION }); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('senda-') && k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  // Firebase y Google: siempre a la red (Firestore tiene su propia caché)
  if (/googleapis\.com$|firebaseio|identitytoolkit|securetoken/.test(url.hostname) && !url.hostname.startsWith('fonts.')) return;
  const propio = url.origin === location.origin;
  const cacheable = propio || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname) || url.hostname === 'www.gstatic.com';
  if (!cacheable) return;
  // Red primero para los archivos propios (así ves siempre la última versión), caché si no hay conexión
  e.respondWith(
    fetch(e.request).then((r) => {
      if (r.ok || r.type === 'opaque') { const copia = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
      return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then((r) => r || caches.match('index.html'))),
  );
});
