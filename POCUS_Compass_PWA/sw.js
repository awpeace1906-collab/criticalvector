const CACHE_NAME = 'pocus-field-guide-v4';
const ASSETS = [
  "./",
  "app.js",
  "styles.css",
  "mobile.css",
  "manifest.json",
  "index.html",
  "content/guide.css",
  "content/manifest.json",
  "content/sections_meta.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "content/sections/s01.html",
  "content/sections/s02.html",
  "content/sections/s03.html",
  "content/sections/s04.html",
  "content/sections/s05.html",
  "content/sections/s06.html",
  "content/sections/s07.html",
  "content/sections/s08.html",
  "content/sections/s09.html",
  "content/sections/s10.html",
  "content/sections/s11.html",
  "content/sections/s12.html",
  "content/sections/s13.html",
  "content/sections/s14.html",
  "content/sections/s15.html",
  "content/sections/s16.html",
  "content/sections/s17.html",
  "content/sections/s18.html",
  "content/sections/s19.html",
  "content/images/s01-1.png",
  "content/images/s01-2.jpg",
  "content/images/s01-3.jpg",
  "content/images/s02-10.png",
  "content/images/s02-11.webp",
  "content/images/s02-12.webp",
  "content/images/s02-13.jpg",
  "content/images/s02-4.png",
  "content/images/s02-5.png",
  "content/images/s02-6.png",
  "content/images/s02-7.webp",
  "content/images/s02-8.jpg",
  "content/images/s02-9.jpg",
  "content/images/s04-14.webp",
  "content/images/s04-15.png",
  "content/images/s04-16.png",
  "content/images/s04-17.webp",
  "content/images/s04-18.webp",
  "content/images/s04-19.jpg",
  "content/images/s04-20.jpg",
  "content/images/s05-21.jpg",
  "content/images/s05-22.webp",
  "content/images/s05-23.png",
  "content/images/s06-24.jpg",
  "content/images/s06-25.jpg",
  "content/images/s06-26.jpg",
  "content/images/s08-27.jpg",
  "content/images/s09-28.jpg",
  "content/images/s09-29.jpg",
  "content/images/s12-30.webp",
  "content/images/s12-31.webp",
  "content/images/s13-32.png",
  "content/images/s14-33.jpg",
  "content/images/s15-34.webp",
  "content/images/s16-35.png"
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((res) => {
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, res.clone());
          return res;
        });
      }).catch(() => cached);
    })
  );
});
