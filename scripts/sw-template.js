const CACHE_PREFIX = `hiflyguy:${self.registration.scope}:`;
const CACHE = `${CACHE_PREFIX}__VERSION__`;
const ASSETS = __ASSETS__;
const absolute = path => new URL(path, self.registration.scope).href;
const shell = new Set(ASSETS.map(absolute));
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(path => new Request(absolute(path), { cache: 'reload' })))));
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith(CACHE_PREFIX) && key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!url.href.startsWith(self.registration.scope)) return;
  const path = url.href.split('?')[0];
  const target = path === self.registration.scope ? absolute('index.html') : path;
  if (!shell.has(target)) return;
  event.respondWith(caches.open(CACHE).then(async cache => (await cache.match(target)) || fetch(event.request)));
});
