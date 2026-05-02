const CACHE_NAME = 'bibliocoins-v1';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/core.js',
  '/manifest.json',
  '/pages/boveda.html',
  '/pages/lectura.html',
  '/pages/disciplina.html',
  '/pages/mercado.html',
  '/pages/equipo.html',
  '/pages/arbol.html',
  '/pages/admin.html',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});
