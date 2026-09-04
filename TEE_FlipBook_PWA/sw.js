const CACHE_NAME = 'tee-flipbook-v2';
const ASSETS = [
  "./",
  "app.js",
  "appendix_images/checklist.png",
  "appendix_images/hemodynamics.png",
  "appendix_images/pa_catheter.png",
  "appendix_images/valve_grading_1.png",
  "appendix_images/valve_grading_2.png",
  "cards.json",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-192.png",
  "icons/icon-maskable-512.png",
  "images/deep-tg-lax.png",
  "images/desc-aorta-lax.png",
  "images/desc-aorta-sax.png",
  "images/me-ascending-ao-lax.png",
  "images/me-ascending-ao-sax.png",
  "images/me-av-lax.png",
  "images/me-av-sax.png",
  "images/me-bicaval.png",
  "images/me-commissural.png",
  "images/me-four-chamber.png",
  "images/me-long-axis.png",
  "images/me-rv-inflow-outflow.png",
  "images/me-two-chamber.png",
  "images/tg-basal-sax.png",
  "images/tg-long-axis.png",
  "images/tg-mid-papillary-sax.png",
  "images/tg-rv-two-chamber.png",
  "images/tg-two-chamber.png",
  "images/ue-aortic-arch-lax.png",
  "images/ue-aortic-arch-sax.png",
  "index.html",
  "manifest.json",
  "reference.json",
  "styles.css"
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
