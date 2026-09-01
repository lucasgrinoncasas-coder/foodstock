// service-worker.js — Cache de la app shell y funcionamiento offline.

const CACHE_VERSION = 'foodstock-v2';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './css/responsive.css',
  './js/app.js',
  './js/database.js',
  './js/firebase.js',
  './js/firebaseConfig.js',
  './js/auth.js',
  './js/views/loginView.js',
  './js/utils.js',
  './js/constants.js',
  './js/households.js',
  './js/products.js',
  './js/shopping.js',
  './js/recipes.js',
  './js/calendar.js',
  './js/settings.js',
  './js/stats.js',
  './js/aiService.js',
  './js/demoData.js',
  './js/recipeCatalog.js',
  './js/recipeCatalogMediterraneo.js',
  './js/recipeCatalogItaliana.js',
  './js/recipePacks.js',
  './js/mealPlanner.js',
  './js/views/planWeekModal.js',
  './js/theme.js',
  './js/ui.js',
  './js/components.js',
  './js/views/home.js',
  './js/views/inventory.js',
  './js/views/shoppingView.js',
  './js/views/calendarView.js',
  './js/views/recipesView.js',
  './js/views/ai.js',
  './js/views/settingsView.js',
  './js/views/householdsView.js',
  './js/views/search.js',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
  './assets/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', clone));
          return response;
        })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(() => cached);
    })
  );
});
